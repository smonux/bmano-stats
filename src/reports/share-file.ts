import { nativePlatform } from '../native/platform';
import { shareNativeFile } from '../native/files';

type FileSharing = {
  canShare?: (data: ShareData) => boolean;
  share?: (data: ShareData) => Promise<void>;
};
export function canShareFile(file: File, target: FileSharing = navigator): boolean {
  if (nativePlatform()) return true;
  try {
    return (
      typeof target.share === 'function' &&
      typeof target.canShare === 'function' &&
      target.canShare({ files: [file] })
    );
  } catch {
    return false;
  }
}

/** Called directly in the click gesture with an already generated file. Cancellation is not failure. */
export async function shareFile(
  file: File,
  title: string,
  target: FileSharing = navigator,
): Promise<'shared' | 'unsupported' | 'cancelled'> {
  if (nativePlatform()) {
    try {
      await shareNativeFile(file, title);
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      throw error;
    }
  }
  if (!canShareFile(file, target)) return 'unsupported';
  try {
    await target.share!({ files: [file], title });
    return 'shared';
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'AbortError'
    )
      return 'cancelled';
    throw error;
  }
}
