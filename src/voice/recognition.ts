import type { Language } from '../i18n';
import { tr } from '../i18n';
import { whistleKeywords } from './keywords';
import { preparedEngine, discardVoiceEngine } from './setup';
import { toVoiceDraft, type CaptureContext } from './interpretation';
import type { Recording } from './recorder';

export type RecognitionTimings = { whistleMs: number; rulesMs: number };
export type RecognizedEvent = ReturnType<typeof toVoiceDraft> & { timings: RecognitionTimings };
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
  const timings = { whistleMs: performance.now() - speechStartedAt, rulesMs: 0 };
  const text = transcript.text.trim();
  if (!text) {
    throw new Error(tr('No se ha reconocido voz. Acércate al micrófono y vuelve a intentarlo.'));
  }
  callbacks.onInterpreting();
  let proposal: unknown = null;
  let warnings: string[] = [];
  const rulesStartedAt = performance.now();
  try {
    const response = await engine.interpret(
      text,
      matchTeamIds.map((teamId) => context.data.teams.find((team) => team.id === teamId)!.name),
      context.data.players
        .filter(
          (player) =>
            !player.isUnknown &&
            !player.deletedAt &&
            player.name &&
            matchTeamIds.includes(player.teamId),
        )
        .map((player) => ({
          name: player.name,
          team:
            player.teamId === context.match.localTeamId
              ? ('equipo1' as const)
              : ('equipo2' as const),
        })),
    );
    proposal = response.proposal;
    warnings = response.warnings;
    timings.rulesMs = performance.now() - rulesStartedAt;
  } catch (error) {
    // Keep a usable transcript even if interpretation fails; the editor can complete it.
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
  return { ...result, timings };
}
