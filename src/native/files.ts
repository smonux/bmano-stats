import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { nativePlatform } from './platform';

function cacheFilename(filename: string) {
  const cleaned = filename.replace(/[^\p{L}\p{N}._-]/gu, '_');
  const extension = cleaned.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? '';
  const stem = extension ? cleaned.slice(0, -extension.length) : cleaned;
  let shortened = '';
  for (const letter of stem) {
    if (new TextEncoder().encode(shortened + letter).length > 120) break;
    shortened += letter;
  }
  return `${shortened || 'export'}${extension}`;
}

/** Private cache only: no external-storage permission, public directory or upload. */
export async function shareNativeFile(file: File, title: string): Promise<boolean> {
  if (!nativePlatform()) return false;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 32768)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
  const name = cacheFilename(file.name);
  const path = `exports/${Date.now()}-${name}`;
  const result = await Filesystem.writeFile({
    path,
    data: btoa(binary),
    directory: Directory.Cache,
    recursive: true,
  });
  try {
    await Share.share({ title, files: [result.uri], dialogTitle: title });
  } catch (error) {
    if (
      error instanceof Error &&
      /share cancel(?:ed|led)|user cancel(?:ed|led)/i.test(error.message)
    )
      throw new DOMException('Sharing cancelled', 'AbortError');
    throw error;
  }
  // Do not delete immediately: the receiving app can read the URI after the sheet closes.
  return true;
}

export async function exportFile(
  file: File,
  title: string,
): Promise<'native' | 'download' | 'cancelled'> {
  try {
    if (await shareNativeFile(file, title)) return 'native';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    throw error;
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'download';
}
