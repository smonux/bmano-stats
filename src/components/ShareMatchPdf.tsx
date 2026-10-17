import { useEffect, useState } from 'react';
import { LoaderCircle, Share2 } from 'lucide-react';
import { tr, useLanguage } from '../i18n';
import type { Snapshot } from '../domain/model';
import { ErrorMessage } from './ui';

export function ShareMatchPdf({ data, matchId }: { data: Snapshot; matchId: string }) {
  const language = useLanguage();
  const [prepared, setPrepared] = useState<{
    file: File;
    data: Snapshot;
    matchId: string;
    language: string;
  } | null>(null);
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setError('');
    setNotice('');
    const worker = new Worker(new URL('../reports/pdf-worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<{ file?: File; error?: boolean }>) => {
      if (event.data.file) setPrepared({ file: event.data.file, data, matchId, language });
      else setError(tr('No se pudo generar el PDF.'));
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
    const url = URL.createObjectURL(file),
      a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(tr('PDF descargado. Puedes compartirlo desde tus archivos.'));
  };
  const share = async () => {
    if (!file || busy) return;
    setBusy(true);
    setNotice('');
    setError('');
    try {
      if (navigator.canShare?.({ files: [file] }) && navigator.share)
        await navigator.share({ files: [file], title: tr('Estadísticas del partido') });
      else download(file);
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) download(file);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="share-match-pdf">
      <button
        className="primary"
        disabled={(!file && !error) || busy}
        onClick={() => (file ? void share() : setAttempt((value) => value + 1))}
      >
        {!file && !error ? <LoaderCircle className="spin" size={17} /> : <Share2 size={17} />}{' '}
        {tr(error ? 'Reintentar PDF' : !file ? 'Preparando PDF…' : 'Compartir PDF del partido')}
      </button>
      {notice && (
        <p className="caption" role="status">
          {notice}
        </p>
      )}
      <ErrorMessage text={error} />
    </div>
  );
}
