import { useEffect, useState } from 'react';
import { tr, useLanguage } from '../../i18n';
import type { Snapshot } from '../../domain/schema';
import type { PdfResponse } from '../../reports/pdf-messages';
import { canShareFile, shareFile } from '../../reports/share-file';
import { exportFile } from '../../native/files';

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
  const download = async (file: File) => {
    const outcome = await exportFile(file, tr('Estadísticas del partido'));
    if (outcome === 'cancelled') return;
    setNotice(
      tr(
        outcome === 'native'
          ? 'Comprueba que la copia se ha guardado en el destino elegido.'
          : 'PDF descargado. Puedes compartirlo desde tus archivos.',
      ),
    );
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
      if (outcome === 'unsupported') await download(file);
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
    download: async () => {
      if (file) {
        setError('');
        try {
          await download(file);
        } catch {
          setError(tr('No se pudo abrir Enviar a. Puedes descargar el PDF.'));
        }
      }
    },
    retry: () => setAttempt((value) => value + 1),
  };
}
