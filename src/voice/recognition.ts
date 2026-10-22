import type { Language } from '../i18n';
import { tr } from '../i18n';
import { whistleKeywords } from './keywords';
import { preparedEngine, discardVoiceEngine } from './setup';
import { toVoiceDraft, type CaptureContext } from './interpretation';
import type { Recording } from './recorder';

export type RecognitionTimings = { whistleMs: number; rulesMs: number; needleMs: number };
export type RecognizedEvent = ReturnType<typeof toVoiceDraft> & {
  timings: RecognitionTimings;
  defaultTeamApplied?: boolean;
};
type RecognitionCallbacks = {
  isActive: () => boolean;
  onInterpreting: () => void;
  onError: (error: unknown) => void;
};

/** Transcribe once, interpret that exact text, then adapt it for human review. */
export async function recognizeCapture(
  audio: Recording,
  context: CaptureContext,
  language: Language,
  callbacks: RecognitionCallbacks,
): Promise<RecognizedEvent | null> {
  if (audio.samples.length < audio.sampleRate * 0.25) {
    throw new Error(
      tr('La grabación es demasiado corta. Mantén pulsado hasta terminar la jugada.'),
    );
  }
  const engine = preparedEngine();
  const matchTeamIds = [context.match.localTeamId, context.match.visitorTeamId];
  const matchPlayers = context.data.players.filter(
    (player) => matchTeamIds.includes(player.teamId) && !player.isUnknown && !player.deletedAt,
  );
  const keywords = whistleKeywords(
    language,
    context.data.teams.filter((team) => matchTeamIds.includes(team.id)).map((team) => team.name),
    matchPlayers,
  );
  const speechStartedAt = performance.now();
  const transcript = await engine.transcribe(audio.samples, audio.sampleRate, keywords);
  if (!callbacks.isActive()) {
    return null;
  }
  const timings = { whistleMs: performance.now() - speechStartedAt, rulesMs: 0, needleMs: 0 };
  const text = transcript.text.trim();
  if (!text) {
    throw new Error(tr('No se ha reconocido voz. Acércate al micrófono y vuelve a intentarlo.'));
  }
  callbacks.onInterpreting();
  let proposal: unknown = null;
  let warnings: string[] = [];
  let defaultTeamApplied = false;
  const interpretationStartedAt = performance.now();
  const teams = matchTeamIds.map(
    (teamId) => context.data.teams.find((team) => team.id === teamId)!.name,
  );
  const players = matchPlayers
    .filter((player) => player.name)
    .map((player) => ({
      name: player.name,
      dorsal: player.dorsal,
      team:
        player.teamId === context.match.localTeamId ? ('equipo1' as const) : ('equipo2' as const),
    }));
  try {
    const response = await engine.interpret(text, teams, players);
    proposal = response.proposal;
    warnings = response.warnings;
    defaultTeamApplied = response.defaultTeamApplied === true;
    timings.rulesMs = response.timing.rulesMs;
    timings.needleMs = response.timing.needleMs;
  } catch (error) {
    timings.rulesMs = performance.now() - interpretationStartedAt;
    // Keep a usable transcript even if interpretation fails; the editor can complete it.
    proposal = { evento: 'desconocido', equipo: 'equipo1' };
    defaultTeamApplied = true;
    warnings = [
      'No se pudo interpretar una única jugada. Conserva la transcripción y completa el evento.',
    ];
    await discardVoiceEngine();
    if (callbacks.isActive()) {
      callbacks.onError(error);
    }
  }
  if (!callbacks.isActive()) {
    return null;
  }
  const result = toVoiceDraft(text, proposal, context);
  result.warnings.unshift(...warnings);
  return { ...result, timings, defaultTeamApplied };
}
