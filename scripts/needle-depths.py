"""Experimental, lossless depth slicing of the pinned Needle 3 CQ archive.

No training or requantization. Applies the official ladder's block selection,
including mHC rows, engram sites, global attention and confidence-head rows.
Reference: cactus-compute/needle, model/architecture.py ladder_slice and
model/export.py. Not a replacement for the official exporter on other models.
"""
import argparse
import hashlib
import json
import math
import struct
from pathlib import Path

HEADER = struct.Struct('<48If')
RECORD = struct.Struct('<BBHIIIIQQII')
SOURCE_SHA256 = 'c9d915eca282ed42d1a09b143b592adb4cc6744ffe2d294adf5cfc5548170c38'


def ladder(layers, depth):
    selected = [0, layers - 1]
    while len(selected) < depth:
        ordered = sorted(selected)
        _, left, right = max(
            ((b - a, a, b) for a, b in zip(ordered, ordered[1:]) if b - a > 1),
            key=lambda gap: (gap[0], -gap[1]),
        )
        selected.append((left + right) // 2)
    return sorted(selected)


def select_rows(tensor, indices, shape):
    record, blob = tensor
    record = list(record)
    rows, cols = record[3:5]
    if record[0] == 3:
        group, bits = record[9:11]
        assert bits in (2, 4)
        padded = math.ceil(cols / group) * group
        packed = padded * bits // 8
        norms = padded // group * 2
        assert len(blob) == rows * (packed + norms)
        blob = (b''.join(blob[i * packed:(i + 1) * packed] for i in indices)
                + b''.join(blob[rows * packed + i * norms:rows * packed + (i + 1) * norms] for i in indices))
    else:
        assert record[0] == 1
        stride = len(blob) // rows
        blob = b''.join(blob[i * stride:(i + 1) * stride] for i in indices)
    record[1] = len(shape)
    record[3:7] = [*shape, *([0] * (4 - len(shape)))]
    record[8] = len(blob)
    return record, blob


def slice_depth(raw, depth):
    header = list(HEADER.unpack_from(raw))
    # Deliberately fail on a new architecture rather than produce a broken model.
    assert header[0] == 0x05E12A84 and header[1] == 581
    assert header[10] == 20 and header[15] == 4 and header[19] == 3
    assert header[31:37] == [5, 3, 7, 11, 15, 19]
    assert 2 <= depth <= 20
    directory = HEADER.size + header[2] * 4
    tensors = []
    for i in range(header[1]):
        record = RECORD.unpack_from(raw, directory + i * RECORD.size)
        blob = raw[record[7]:record[7] + record[8]]
        assert len(blob) == record[8]
        tensors.append((record, blob))
    selected = ladder(20, depth)
    remap = {layer: i for i, layer in enumerate(selected)}
    result = [tensors[0]]
    for layer in selected:
        result.extend(tensors[1 + layer * 27:1 + (layer + 1) * 27])
    # Six elementwise mHC arrays, followed by three row-major CQ maps.
    for i in range(541, 550):
        record, _ = tensors[i]
        shape = list(record[3:3 + record[1]])
        factor = shape[0] // 20
        assert shape[0] % 20 == 0
        rows = [layer * factor + j for layer in selected for j in range(factor)]
        shape[0] = depth * factor
        result.append(select_rows(tensors[i], rows, shape))
    result.extend(tensors[550:552])  # Hadamard permutations
    sites = header[32:37]
    kept_sites = [site for site in sites if site in remap]
    for i, site in enumerate(sites):
        if site in remap:
            result.extend(tensors[552 + i * 4:556 + i * 4])
    result.extend(tensors[572:574])  # Final norm, confidence manifest
    assert struct.unpack('<e', tensors[573][1])[0] == 2
    rows = [0, *(layer + 1 for layer in selected)]
    result.append(select_rows(tensors[574], [r * 4 + j for r in rows for j in range(4)], [(depth + 1) * 4, 768]))
    result.append(select_rows(tensors[575], rows, [depth + 1, 4]))
    result.append(tensors[576])
    # Confidence row_bias: [queries, embedding + layers, probes].
    record, blob = tensors[577]
    bias = b''.join(blob[(q * 21 + r) * 8:(q * 21 + r + 1) * 8] for q in range(4) for r in rows)
    record = list(record)
    record[3:7], record[8] = [4, depth + 1, 4, 0], len(bias)
    result.append((record, bias))
    result.extend(tensors[578:])
    header[1], header[10], header[31] = len(result), depth, len(kept_sites)
    mask = header[17] | header[18] << 32
    mask = sum(1 << remap[layer] for layer in selected if mask >> layer & 1)
    header[17], header[18] = mask & 0xFFFFFFFF, mask >> 32
    header[32:48] = [*(remap[site] for site in kept_sites), *([0] * (16 - len(kept_sites)))]
    prefix = HEADER.pack(*header) + raw[HEADER.size:directory]
    position = len(prefix) + len(result) * RECORD.size
    records, blobs = [], []
    for record, blob in result:
        record = list(record)
        aligned = (position + 63) // 64 * 64
        blobs.append(b'\0' * (aligned - position) + blob)
        record[7] = aligned
        records.append(RECORD.pack(*record))
        position = aligned + len(blob)
    output = prefix + b''.join(records) + b''.join(blobs)
    return output, selected


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--depths', nargs='+', type=int, default=[4, 8, 12])
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    raw = args.source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != SOURCE_SHA256:
        parser.error('Expected the pinned cactus-needle 0.3.0 Needle 3 archive; input SHA-256 differs.')
    args.out.mkdir(parents=True, exist_ok=True)
    manifest = {'experimental': True, 'sourceSha256': hashlib.sha256(raw).hexdigest(), 'models': []}
    # A full-depth roundtrip must be byte-identical, including confidence rows.
    assert slice_depth(raw, 20)[0] == raw
    for depth in args.depths:
        output, selected = slice_depth(raw, depth)
        path = args.out / f'needle3-{depth}l.cact'
        path.write_bytes(output)
        manifest['models'].append({'path': path.name, 'depth': depth, 'blocks': selected, 'bytes': len(output), 'sha256': hashlib.sha256(output).hexdigest()})
    (args.out / 'depths.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps(manifest, indent=2))
