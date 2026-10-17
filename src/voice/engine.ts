import { tr, type Language } from '../i18n';
import { createWhistle, createNeedle } from 'cactus-needle/browser';
import type { RulePlayer, TeamPerspective } from './analysis/types';
import { DEFAULT_NEEDLE_DEPTH, type NeedleDepth } from './model-artifacts';
import { needleModel } from './needle-model';
import { routeVoiceEvent } from './event-routing';
import { toolForEvent, extractionFacts } from './play-schema';
import { adaptNeedleResult } from './hybrid';
type WhistleSession = Awaited<ReturnType<typeof createWhistle>>;
type NeedleSession = Awaited<ReturnType<typeof createNeedle>>;

/** Reused from pre-match preparation. Closing cancels workers and active inference. */
export class VoiceEngine {
  constructor(
    private language: Language = 'es',
    private depth: NeedleDepth = DEFAULT_NEEDLE_DEPTH,
    private defaultTeam: TeamPerspective = 'equipo1',
  ) {}
  private whistle?: WhistleSession;
  private needle?: NeedleSession;
  private controller = new AbortController();
  get ready() {
    return Boolean(this.whistle && this.needle);
  }
  async prepare(progress: (text: string) => void, offline = !navigator.onLine) {
    if (this.ready) {
      return;
    }
    const options = (name: string) => ({
      offline,
      abortSignal: this.controller.signal,
      onDownloadProgress: ({ percentage, loaded }: { percentage?: number; loaded: number }) =>
        progress(
          `${name}: ${percentage !== undefined ? Math.round(percentage) + ' %' : (loaded / 1e6).toFixed(1) + ' MB'}`,
        ),
    });
    try {
      progress(tr('Cargando Whistle…'));
      this.whistle = await createWhistle(options('Whistle'));
      const model = needleModel(this.depth);
      progress(`Needle: ${this.depth}`);
      this.needle = await createNeedle({
        ...options('Needle'),
        model: model.url,
        modelSha256: model.sha256,
        stateless: true,
        system: extractionFacts(this.language, this.defaultTeam),
        maxOutputTokens: 192,
      });
      progress(tr('Modelos listos en este dispositivo.'));
    } catch (error) {
      await this.close();
      throw error;
    }
  }
  async transcribe(samples: Float32Array, sampleRate: number, keywords: string[]) {
    if (!this.whistle) {
      throw new Error('Prepara los modelos antes de grabar.');
    }
    return this.whistle.transcribe(
      { samples, sampleRate },
      { language: this.language, keywords, abortSignal: this.controller.signal },
    );
  }
  async interpret(text: string, teams: string[], players: RulePlayer[] = []) {
    const start = performance.now();
    const routed = routeVoiceEvent(text, this.language, teams, players);
    const rulesMs = performance.now() - start;
    if (!routed.event) {
      return {
        proposal: { evento: 'desconocido' as const, equipo: this.defaultTeam },
        warnings: [...routed.warnings, 'Se ha aplicado el equipo por defecto. Revisa el equipo.'],
        timing: { rulesMs, needleMs: 0, method: 'hybrid' as const },
      };
    }
    if (!this.needle) {
      throw new Error('Prepara los modelos antes de grabar.');
    }
    const inferenceStartedAt = performance.now();
    const result = await this.needle.complete(text, {
      tools: toolForEvent(routed.event, teams, this.defaultTeam),
      maxNewTokens: 192,
      abortSignal: AbortSignal.any([this.controller.signal, AbortSignal.timeout(45_000)]),
    });
    const needleMs = performance.now() - inferenceStartedAt;
    const adapted = adaptNeedleResult(routed.event, result, this.defaultTeam);
    return {
      ...adapted,
      warnings: [...routed.warnings, ...adapted.warnings],
      timing: { rulesMs, needleMs, method: 'hybrid' as const },
    };
  }

  async close() {
    this.controller.abort();
    const sessions = [this.whistle, this.needle];
    this.whistle = undefined;
    this.needle = undefined;
    await Promise.allSettled(sessions.map((session) => session?.close()));
  }
}
export function voiceError(error: unknown, loading = false) {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'No hay permiso para el micrófono. Revisa los permisos de este sitio y los permisos de micrófono del navegador en el dispositivo. Vuelve a intentarlo.';
  }
  if (error instanceof DOMException && error.name === 'NotFoundError') {
    return 'No se encontró un micrófono. Conecta uno o usa la entrada manual.';
  }
  if (error instanceof DOMException && error.name === 'NotReadableError') {
    return 'El micrófono está ocupado o no se puede abrir.';
  }
  if (loading && !navigator.onLine) {
    return 'No se pudieron cargar los modelos sin conexión. Prepáralos una vez con conexión en este navegador.';
  }
  return error instanceof Error
    ? tr('No se pudo procesar la voz: {reason}', { reason: tr(error.message) })
    : 'No se pudo procesar la voz. Puedes usar la entrada manual.';
}
