import { useEffect, useState } from 'react';
import { tr, useLanguage } from '../../i18n';
import type { Snapshot } from '../../domain/schema';
import type { PdfResponse } from '../../reports/pdf-messages';
import { canShareFile, shareFile } from '../../reports/share-file';

/** Prepares off the main thread, while sharing still runs in the user's click gesture. */
export function useMatchPdf(data: Snapshot, matchId: string) {
  const language = useLanguage();
  const [prepared, setPrepared] = useState<{
    file: File;
    data: Snapshot;
    matchId: string;
    language: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setError('');
    setNotice('');
    const worker = new Worker(new URL('../../reports/pdf-worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<PdfResponse>) => {
      if (event.data.file) {
        setPrepared({ file: event.data.file, data, matchId, language });
      } else {
        setError(tr('No se pudo generar el PDF.'));
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      setError(tr('No se pudo generar el PDF.'));
    };
    worker.postMessage({ data, matchId, language });
    return () => worker.terminate();
  }, [data, matchId, language, attempt]);
  const file =
    prepared?.data === data && prepared.matchId === matchId && prepared.language === language
      ? prepared.file
      : null;
  const download = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(tr('PDF descargado. Puedes compartirlo desde tus archivos.'));
  };
  const share = async () => {
    if (!file || busy) {
      return;
    }
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const outcome = await shareFile(file, tr('Estadísticas del partido'));
      if (outcome === 'unsupported') download(file);
    } catch {
      setError(tr('No se pudo abrir Enviar a. Puedes descargar el PDF.'));
    } finally {
      setBusy(false);
    }
  };
  return {
    file,
    error,
    busy,
    notice,
    share,
    nativeShare: Boolean(file && canShareFile(file)),
    download: () => {
      if (file) {
        setError('');
        download(file);
      }
    },
    retry: () => setAttempt((value) => value + 1),
  };
}
