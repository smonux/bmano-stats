import { DEFAULT_MODEL, DEFAULT_SPEECH_MODEL } from 'cactus-needle/browser';

/** Cache layout pinned to cactus-needle 0.3.0. Presence is rechecked, never a localStorage flag. */
export async function localModelsPresent(): Promise<boolean> {
  if (!globalThis.caches) return false;
  // Whistle shares this SDK cache namespace; DEFAULT_MODEL is only its revision key.
  const name = `cactus-needle-${DEFAULT_MODEL.revision}`;
  if (!(await caches.has(name))) return false;
  const cache = await caches.open(name);
  for (const model of [DEFAULT_SPEECH_MODEL]) {
    const key = new URL(model.url);
    key.searchParams.set('__needle_sha256', model.sha256);
    const response = await cache.match(key.href);
    if (!response || (await response.blob()).size !== model.size) return false;
  }
  return true;
}
export function microphoneProblem(): string {
  if (!globalThis.isSecureContext)
    return 'El navegador no considera segura esta página. Abre la dirección HTTPS de Tailscale para usar el micrófono.';
  if (!navigator.mediaDevices?.getUserMedia)
    return 'Este navegador no ofrece acceso al micrófono. Revisa los permisos de Firefox y del sistema para esta página.';
  if (!globalThis.AudioContext || !globalThis.AudioWorkletNode)
    return 'Este navegador no admite la grabación necesaria. Actualiza Firefox y vuelve a intentarlo.';
  return '';
}
export async function checkMicrophone() {
  const problem = microphoneProblem();
  if (problem) throw new Error(problem);
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    video: false,
  });
  stream.getTracks().forEach((track) => track.stop());
}
