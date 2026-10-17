import { createMatchPdf } from './match-pdf';
import type { Snapshot } from '../domain/model';
import type { Language } from '../i18n';
self.onmessage = async (
  event: MessageEvent<{ data: Snapshot; matchId: string; language: Language }>,
) => {
  try {
    const { data, matchId, language } = event.data;
    const file = await createMatchPdf(data, matchId, language);
    self.postMessage({ file });
  } catch {
    self.postMessage({ error: true });
  }
};
