import { zip, unzip, strToU8 } from 'fflate';
import { validateBackup, type Backup } from '../domain/model';

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
const tooLarge = 'La copia no puede superar 20 MB.';
const invalid = 'Copia no válida. Comprueba que el archivo sea una copia de esta aplicación.';

export async function backupZip(input: Backup): Promise<Uint8Array> {
  const bytes = strToU8(JSON.stringify(validateBackup(input), null, 2));
  if (bytes.length > MAX_BACKUP_BYTES) throw new Error(tooLarge);
  return new Promise((resolve, reject) =>
    zip({ 'handball-stats.json': bytes }, { level: 6 }, (error, data) =>
      error ? reject(new Error(invalid)) : resolve(data),
    ),
  );
}

export async function readBackupFile(file: Pick<File, 'size' | 'arrayBuffer'>): Promise<Backup> {
  if (file.size > MAX_BACKUP_BYTES) throw new Error(tooLarge);
  let bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length > MAX_BACKUP_BYTES) throw new Error(tooLarge);
  // Detect the content, including ZIPs whose extension was renamed.
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    let jsonCount = 0,
      oversized = false;
    const files = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
      try {
        unzip(
          bytes,
          {
            filter: (entry) => {
              if (!entry.name.toLowerCase().endsWith('.json') || entry.name.startsWith('__MACOSX/'))
                return false;
              jsonCount++;
              if (entry.originalSize > MAX_BACKUP_BYTES) {
                oversized = true;
                return false;
              }
              return jsonCount === 1;
            },
          },
          (error, data) => (error ? reject(new Error(invalid)) : resolve(data)),
        );
      } catch {
        reject(new Error(invalid));
      }
    });
    if (oversized) throw new Error(tooLarge);
    if (jsonCount !== 1 || Object.keys(files).length !== 1)
      throw new Error('El ZIP debe contener una única copia JSON.');
    bytes = new Uint8Array(Object.values(files)[0]);
    if (bytes.length > MAX_BACKUP_BYTES) throw new Error(tooLarge);
  }
  try {
    return validateBackup(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  } catch {
    throw new Error(invalid);
  }
}
