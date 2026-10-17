# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
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

HEADER = struct.Struct("<48If")
RECORD = struct.Struct("<BBHIIIIQQII")
SOURCE_SHA256 = "c9d915eca282ed42d1a09b143b592adb4cc6744ffe2d294adf5cfc5548170c38"
SOURCE_LAYERS = 20
BLOCK_TENSORS = 27
MHC_START, MHC_END = 541, 550
ENGRAM_START, ENGRAM_TENSORS = 552, 4
FINAL_NORM_START = 572
CONFIDENCE_WEIGHT, CONFIDENCE_BIAS = 574, 575
CONFIDENCE_ROW_BIAS = 577
ARCHIVE_ALIGNMENT = 64


def ladder(layers, depth):
    """Include both endpoints, then bisect the earliest largest remaining gap."""
    selected = [0, layers - 1]
    while len(selected) < depth:
        ordered = sorted(selected)
        _, left, right = max(
            (
                (right - left, left, right)
                for left, right in zip(ordered, ordered[1:])
                if right - left > 1
            ),
            key=lambda gap: (gap[0], -gap[1]),
        )
        selected.append((left + right) // 2)
    return sorted(selected)


def select_rows(tensor, indices, shape):
    """Slice packed rows and their quantization norms without requantizing."""
    record, blob = tensor
    record = list(record)
    rows, columns = record[3:5]
    if record[0] == 3:
        group, bits = record[9:11]
        assert bits in (2, 4)
        padded = math.ceil(columns / group) * group
        packed = padded * bits // 8
        norms = padded // group * 2
        assert len(blob) == rows * (packed + norms)
        packed_rows = b"".join(blob[row * packed : (row + 1) * packed] for row in indices)
        norm_rows = b"".join(
            blob[rows * packed + row * norms : rows * packed + (row + 1) * norms]
            for row in indices
        )
        blob = packed_rows + norm_rows
    else:
        assert record[0] == 1
        stride = len(blob) // rows
        blob = b"".join(blob[row * stride : (row + 1) * stride] for row in indices)
    # Record fields: rank, four shape dimensions, data offset and byte count.
    record[1] = len(shape)
    record[3:7] = [*shape, *([0] * (4 - len(shape)))]
    record[8] = len(blob)
    return record, blob


def read_tensors(raw, header):
    directory = HEADER.size + header[2] * 4
    tensors = []
    for index in range(header[1]):
        record = RECORD.unpack_from(raw, directory + index * RECORD.size)
        blob = raw[record[7] : record[7] + record[8]]
        assert len(blob) == record[8]
        tensors.append((record, blob))
    return directory, tensors


def slice_confidence(tensors, selected):
    depth = len(selected)
    assert struct.unpack("<e", tensors[573][1])[0] == 2
    rows = [0, *(layer + 1 for layer in selected)]
    result = [
        select_rows(
            tensors[CONFIDENCE_WEIGHT],
            [row * 4 + probe for row in rows for probe in range(4)],
            [(depth + 1) * 4, 768],
        ),
        select_rows(tensors[CONFIDENCE_BIAS], rows, [depth + 1, 4]),
        tensors[576],
    ]
    # Confidence row_bias: [queries, embedding + layers, probes].
    record, blob = tensors[CONFIDENCE_ROW_BIAS]
    bias = b"".join(
        blob[(query * 21 + row) * 8 : (query * 21 + row + 1) * 8]
        for query in range(4)
        for row in rows
    )
    record = list(record)
    record[3:7], record[8] = [4, depth + 1, 4, 0], len(bias)
    result.append((record, bias))
    return result


def select_tensors(tensors, selected, sites):
    depth = len(selected)
    result = [tensors[0]]
    for layer in selected:
        result.extend(tensors[1 + layer * BLOCK_TENSORS : 1 + (layer + 1) * BLOCK_TENSORS])
    # Six elementwise mHC arrays, followed by three row-major CQ maps.
    for index in range(MHC_START, MHC_END):
        record, _ = tensors[index]
        shape = list(record[3 : 3 + record[1]])
        factor = shape[0] // SOURCE_LAYERS
        assert shape[0] % SOURCE_LAYERS == 0
        rows = [layer * factor + offset for layer in selected for offset in range(factor)]
        shape[0] = depth * factor
        result.append(select_rows(tensors[index], rows, shape))
    result.extend(tensors[MHC_END:ENGRAM_START])  # Hadamard permutations.
    for index, site in enumerate(sites):
        if site in selected:
            start = ENGRAM_START + index * ENGRAM_TENSORS
            result.extend(tensors[start : start + ENGRAM_TENSORS])
    result.extend(tensors[FINAL_NORM_START:CONFIDENCE_WEIGHT])
    result.extend(slice_confidence(tensors, selected))
    result.extend(tensors[CONFIDENCE_ROW_BIAS + 1 :])
    return result


def remap_header(header, selected, tensor_count):
    remap = {layer: index for index, layer in enumerate(selected)}
    kept_sites = [site for site in header[32:37] if site in remap]
    header[1], header[10], header[31] = tensor_count, len(selected), len(kept_sites)
    mask = header[17] | header[18] << 32
    mask = sum(1 << remap[layer] for layer in selected if mask >> layer & 1)
    header[17], header[18] = mask & 0xFFFFFFFF, mask >> 32
    header[32:48] = [*(remap[site] for site in kept_sites), *([0] * (16 - len(kept_sites)))]


def pack_archive(header, token_data, tensors):
    prefix = HEADER.pack(*header) + token_data
    position = len(prefix) + len(tensors) * RECORD.size
    records, blobs = [], []
    for record, blob in tensors:
        record = list(record)
        aligned = (position + ARCHIVE_ALIGNMENT - 1) // ARCHIVE_ALIGNMENT * ARCHIVE_ALIGNMENT
        blobs.append(b"\0" * (aligned - position) + blob)
        record[7] = aligned
        records.append(RECORD.pack(*record))
        position = aligned + len(blob)
    return prefix + b"".join(records) + b"".join(blobs)


def slice_depth(raw, depth):
    header = list(HEADER.unpack_from(raw))
    # Deliberately fail on a new architecture rather than produce a broken model.
    assert header[0] == 0x05E12A84 and header[1] == 581
    assert header[10] == SOURCE_LAYERS and header[15] == 4 and header[19] == 3
    assert header[31:37] == [5, 3, 7, 11, 15, 19]
    assert 2 <= depth <= SOURCE_LAYERS
    directory, tensors = read_tensors(raw, header)
    selected = ladder(SOURCE_LAYERS, depth)
    result = select_tensors(tensors, selected, header[32:37])
    remap_header(header, selected, len(result))
    output = pack_archive(header, raw[HEADER.size:directory], result)
    return output, selected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--depths", nargs="+", type=int, default=[4, 8, 12])
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    raw = args.source.read_bytes()
    source_hash = hashlib.sha256(raw).hexdigest()
    if source_hash != SOURCE_SHA256:
        parser.error("Expected the pinned cactus-needle 0.3.0 Needle 3 archive; input SHA-256 differs.")
    args.out.mkdir(parents=True, exist_ok=True)
    manifest = {"experimental": True, "sourceSha256": source_hash, "models": []}
    # A full-depth roundtrip must be byte-identical, including confidence rows.
    assert slice_depth(raw, SOURCE_LAYERS)[0] == raw
    for depth in args.depths:
        output, selected = slice_depth(raw, depth)
        path = args.out / f"needle3-{depth}l.cact"
        path.write_bytes(output)
        manifest["models"].append({
            "path": path.name, "depth": depth, "blocks": selected,
            "bytes": len(output), "sha256": hashlib.sha256(output).hexdigest(),
        })
    (args.out / "depths.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
