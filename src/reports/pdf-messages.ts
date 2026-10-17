import type { Snapshot } from '../domain/schema';
import type { Language } from '../i18n';

export type PdfRequest = { data: Snapshot; matchId: string; language: Language };
export type PdfResponse = { file: File; error?: never } | { error: true; file?: never };
