import { DEFAULT_SPEECH_MODEL } from 'cactus-needle/browser';

let pending: Promise<Uint8Array> | undefined;

/** Immutable packaged weights, verified once per process. No flags or network fallback. */
export function bundledWhistle(): Promise<Uint8Array> {
  return (pending ??= (async () => {
    const response = await fetch('/models/whistle.cact', { credentials: 'same-origin' });
    if (!response.ok)
      throw new Error(
        'Los archivos de voz incluidos no están disponibles. Reinstala la aplicación o usa la entrada manual.',
      );
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength !== DEFAULT_SPEECH_MODEL.size)
      throw new Error(
        'Los archivos de voz incluidos están dañados. Reinstala la aplicación o usa la entrada manual.',
      );
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const sha256 = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    if (sha256 !== DEFAULT_SPEECH_MODEL.sha256)
      throw new Error(
        'Los archivos de voz incluidos están dañados. Reinstala la aplicación o usa la entrada manual.',
      );
    return bytes;
  })().catch((error) => {
    pending = undefined;
    throw error;
  }));
}
