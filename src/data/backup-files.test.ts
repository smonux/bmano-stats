import { expect, test } from 'vitest';
import { zipSync, unzipSync, strToU8 } from 'fflate';
import { backupZip, readBackupFile, MAX_BACKUP_BYTES } from './backup-files';
import type { Backup } from '../domain/model';
const stamp = { createdAt: 1, updatedAt: 1, deletedAt: null };
const backup: Backup = {
  format: 'handball-stats',
  version: 1,
  exportedAt: 10,
  teams: [
    { ...stamp, id: 'a', name: 'La Jota', nameKey: 'la jota' },
    { ...stamp, id: 'b', name: 'Rival', nameKey: 'rival' },
  ],
  players: [
    { ...stamp, id: 'unknown:a', teamId: 'a', isUnknown: true, name: 'Desconocido', dorsal: null },
    { ...stamp, id: 'unknown:b', teamId: 'b', isUnknown: true, name: 'Desconocido', dorsal: null },
  ],
  matches: [
    {
      ...stamp,
      id: 'm',
      localTeamId: 'a',
      visitorTeamId: 'b',
      date: '2026-10-16',
      status: 'active',
      clock: { period: 1, elapsedMs: 3000, startedAt: null },
      exclusions: [
        { id: 'x', teamId: 'a', dorsal: null, running: false, startedAt: null, remainingMs: 90000 },
        null,
        null,
      ],
    },
  ],
  events: [
    {
      ...stamp,
      id: 'e',
      schemaVersion: 1,
      matchId: 'm',
      type: 'goal',
      teamId: 'a',
      primaryPlayerId: 'unknown:a',
      relatedPlayerId: null,
      period: 1,
      minute: 0,
      orderKey: 1,
      metadata: {},
      rawText: 'Gol nuestro',
      note: 'Prueba ñ',
    },
  ],
};
const file = (bytes: Uint8Array) => ({
  size: bytes.length,
  arrayBuffer: async () => new Uint8Array(bytes).buffer,
});
test('a standard ZIP restores every entity, raw transcript and suspension timer unchanged', async () => {
  const bytes = await backupZip(backup);
  expect([...bytes.slice(0, 4)]).toEqual([80, 75, 3, 4]);
  expect(Object.keys(unzipSync(bytes))).toEqual(['handball-stats.json']);
  expect(await readBackupFile(file(bytes))).toEqual(backup);
  expect(await readBackupFile(file(strToU8(JSON.stringify(backup))))).toEqual(backup);
});
test('accepts a user-zipped JSON in a folder and ignores ordinary non-JSON attachments', async () => {
  const bytes = zipSync({
    'folder/copia.JSON': strToU8(JSON.stringify(backup)),
    'readme.txt': strToU8('copia'),
  });
  expect(await readBackupFile(file(bytes))).toEqual(backup);
});
test('invalid archives, ambiguous JSONs and broken references fail before any data import', async () => {
  for (const bytes of [
    strToU8('not JSON'),
    new Uint8Array([80, 75, 3, 4]),
    zipSync({ 'text.txt': strToU8('x') }),
    zipSync({ 'one.json': strToU8('{}'), 'two.json': strToU8('{}') }),
    zipSync({ 'data.json': strToU8('{}') }),
  ]) {
    await expect(readBackupFile(file(bytes))).rejects.toThrow();
  }
  const broken = { ...backup, events: [{ ...backup.events[0], matchId: 'missing' }] };
  await expect(readBackupFile(file(strToU8(JSON.stringify(broken))))).rejects.toThrow(
    'Copia no válida',
  );
});
test('checks both the uploaded size and expanded size before expanding an oversized JSON', async () => {
  await expect(
    readBackupFile({ size: MAX_BACKUP_BYTES + 1, arrayBuffer: async () => new ArrayBuffer(0) }),
  ).rejects.toThrow('20 MB');
  const tiny = zipSync({ 'data.json': strToU8('{}') });
  const signature = [80, 75, 1, 2];
  const offset = tiny.findIndex((_, i) => signature.every((v, j) => tiny[i + j] === v));
  expect(offset).toBeGreaterThan(0);
  new DataView(tiny.buffer).setUint32(offset + 24, MAX_BACKUP_BYTES + 1, true);
  await expect(readBackupFile(file(tiny))).rejects.toThrow('20 MB');
});
