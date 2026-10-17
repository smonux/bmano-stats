import { zip, unzip, strToU8 } from 'fflate';
import { validateBackup } from '../domain/backup';
import type { Backup } from '../domain/schema';

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
const TOO_LARGE_MESSAGE = 'La copia no puede superar 20 MB.';
const INVALID_BACKUP_MESSAGE =
  'Copia no válida. Comprueba que el archivo sea una copia de esta aplicación.';

function assertBackupSize(bytes: number) {
  if (bytes > MAX_BACKUP_BYTES) {
    throw new Error(TOO_LARGE_MESSAGE);
  }
}

export async function backupZip(input: Backup): Promise<Uint8Array> {
  const bytes = strToU8(JSON.stringify(validateBackup(input), null, 2));
  assertBackupSize(bytes.length);
  return new Promise((resolve, reject) => {
    zip({ 'handball-stats.json': bytes }, { level: 6 }, (error, archive) => {
      if (error) {
        reject(new Error(INVALID_BACKUP_MESSAGE));
      } else {
        resolve(archive);
      }
    });
  });
}

export async function readBackupFile(file: Pick<File, 'size' | 'arrayBuffer'>): Promise<Backup> {
  assertBackupSize(file.size);
  let bytes = new Uint8Array(await file.arrayBuffer());
  assertBackupSize(bytes.length);
  // Inspect content rather than trusting a filename or MIME type.
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    bytes = new Uint8Array(await extractSingleJson(bytes));
    assertBackupSize(bytes.length);
  }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return validateBackup(JSON.parse(text));
  } catch {
    throw new Error(INVALID_BACKUP_MESSAGE);
  }
}

async function extractSingleJson(bytes: Uint8Array): Promise<Uint8Array> {
  let jsonCount = 0;
  let oversizedEntry = false;
  const files = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    try {
      unzip(
        bytes,
        {
          filter: (entry) => {
            if (!entry.name.toLowerCase().endsWith('.json') || entry.name.startsWith('__MACOSX/')) {
              return false;
            }
            jsonCount++;
            if (entry.originalSize > MAX_BACKUP_BYTES) {
              oversizedEntry = true;
              return false;
            }
            // Inspect every entry, but never expand more than one candidate.
            return jsonCount === 1;
          },
        },
        (error, entries) => {
          if (error) {
            reject(new Error(INVALID_BACKUP_MESSAGE));
          } else {
            resolve(entries);
          }
        },
      );
    } catch {
      reject(new Error(INVALID_BACKUP_MESSAGE));
    }
  });
  if (oversizedEntry) {
    throw new Error(TOO_LARGE_MESSAGE);
  }
  if (jsonCount !== 1 || Object.keys(files).length !== 1) {
    throw new Error('El ZIP debe contener una única copia JSON.');
  }
  return Object.values(files)[0];
}
