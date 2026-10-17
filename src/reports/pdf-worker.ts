import { createMatchPdf } from './match-pdf';
import type { PdfRequest } from './pdf-messages';
self.onmessage = async (event: MessageEvent<PdfRequest>) => {
  try {
    const { data, matchId, language } = event.data;
    const file = await createMatchPdf(data, matchId, language);
    self.postMessage({ file });
  } catch {
    self.postMessage({ error: true });
  }
};
