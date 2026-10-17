import { beforeEach, expect, test, vi } from 'vitest';
import type { Match, Snapshot } from '../domain/schema';
import { recognizeCapture } from './recognition';
import { captureContext } from './capture-context';

const mocks = vi.hoisted(() => ({
  transcribe: vi.fn(),
  interpret: vi.fn(),
  discard: vi.fn(),
}));
vi.mock('./setup', () => ({
  preparedEngine: () => mocks,
  discardVoiceEngine: mocks.discard,
}));

const base = { createdAt: 1, updatedAt: 1, deletedAt: null };
const match: Match = {
  ...base,
  id: 'match',
  localTeamId: 'ours',
  visitorTeamId: 'rival',
  date: '2026-10-16',
  status: 'active',
  clock: { period: 2, elapsedMs: 180000, startedAt: null },
};
const data: Snapshot = {
  matches: [match],
  events: [],
  // Catalogue order differs from the recording perspective deliberately.
  teams: [
    { ...base, id: 'rival', name: 'Leones', nameKey: 'leones' },
    { ...base, id: 'ours', name: 'La Jota', nameKey: 'la jota' },
  ],
  players: [
    { ...base, id: 'ana', teamId: 'ours', name: 'Ana', dorsal: 9, isUnknown: false },
    { ...base, id: 'leo', teamId: 'rival', name: 'Leo', dorsal: 0, isUnknown: false },
    {
      ...base,
      id: 'gone',
      teamId: 'ours',
      name: 'Borrado',
      dorsal: 4,
      isUnknown: false,
      deletedAt: 2,
    },
  ],
};
const context = captureContext(match, data);
const audio = { samples: new Float32Array(16000), sampleRate: 16000 };
const callbacks = () => ({
  isActive: vi.fn(() => true),
  onInterpreting: vi.fn(),
  onError: vi.fn(),
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.transcribe.mockResolvedValue({ text: '  gol nuestro de Ana  ' });
  mocks.interpret.mockResolvedValue({
    proposal: { evento: 'gol', equipo: 'equipo1', nombre: 'Ana' },
    warnings: ['advertencia'],
  });
  mocks.discard.mockResolvedValue(undefined);
});

test('transcribes with match hints and interprets using the recording perspective', async () => {
  const progress = callbacks();
  const result = await recognizeCapture(audio, context, 'es', progress);
  expect(mocks.transcribe).toHaveBeenCalledWith(
    audio.samples,
    16000,
    expect.arrayContaining(['Ana', 'Leo', '9', 'nueve', '0']),
  );
  expect(mocks.transcribe.mock.calls[0][2]).not.toContain('Borrado');
  expect(mocks.interpret).toHaveBeenCalledWith(
    'gol nuestro de Ana',
    ['La Jota', 'Leones'],
    [
      { name: 'Ana', team: 'equipo1' },
      { name: 'Leo', team: 'equipo2' },
    ],
  );
  expect(result?.draft).toMatchObject({
    type: 'goal',
    teamId: 'ours',
    primaryDorsal: '9',
    period: 2,
    minute: 3,
    rawText: 'gol nuestro de Ana',
  });
  expect(result?.warnings).toEqual(['advertencia']);
  expect(progress.onInterpreting).toHaveBeenCalledOnce();
  expect(progress.onError).not.toHaveBeenCalled();
});

test('rejects short recordings before inference and empty transcripts before interpretation', async () => {
  await expect(
    recognizeCapture({ ...audio, samples: new Float32Array(100) }, context, 'es', callbacks()),
  ).rejects.toThrow('demasiado corta');
  expect(mocks.transcribe).not.toHaveBeenCalled();
  mocks.transcribe.mockResolvedValue({ text: '  ' });
  await expect(recognizeCapture(audio, context, 'es', callbacks())).rejects.toThrow(
    'No se ha reconocido voz',
  );
  expect(mocks.interpret).not.toHaveBeenCalled();
});

test('preserves the transcript for manual review when interpretation fails', async () => {
  const failure = new Error('failed');
  mocks.interpret.mockRejectedValue(failure);
  const progress = callbacks();
  const result = await recognizeCapture(audio, context, 'es', progress);
  expect(result?.draft).toMatchObject({ type: null, teamId: null, rawText: 'gol nuestro de Ana' });
  expect(mocks.discard).toHaveBeenCalledOnce();
  expect(progress.onError).toHaveBeenCalledWith(failure);
});

test('does not interpret after the capturing screen has closed', async () => {
  const progress = callbacks();
  progress.isActive.mockReturnValue(false);
  expect(await recognizeCapture(audio, context, 'es', progress)).toBeNull();
  expect(mocks.interpret).not.toHaveBeenCalled();
  expect(progress.onInterpreting).not.toHaveBeenCalled();
});
