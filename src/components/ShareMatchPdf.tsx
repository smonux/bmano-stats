import { LoaderCircle, Share2 } from 'lucide-react';
import { tr } from '../i18n';
import type { Snapshot } from '../domain/schema';
import { ErrorMessage } from './ui';
import { useMatchPdf } from './statistics/useMatchPdf';

export function ShareMatchPdf({ data, matchId }: { data: Snapshot; matchId: string }) {
  const { file, error, busy, notice, share, retry, nativeShare, download } = useMatchPdf(
    data,
    matchId,
  );

  return (
    <div className="share-match-pdf">
      <button
        className="primary"
        disabled={(!file && !error) || busy}
        onClick={() => (file ? void share() : retry())}
      >
        {!file && !error ? <LoaderCircle className="spin" size={17} /> : <Share2 size={17} />}{' '}
        {tr(
          !file
            ? error
              ? 'Reintentar PDF'
              : 'Preparando PDF…'
            : busy
              ? 'Abriendo Enviar a…'
              : nativeShare
                ? 'Enviar PDF a…'
                : 'Descargar PDF',
        )}
      </button>
      {file && error && nativeShare && (
        <button disabled={busy} onClick={download}>
          {tr('Descargar PDF')}
        </button>
      )}
      {notice && (
        <p className="caption" role="status">
          {notice}
        </p>
      )}
      <ErrorMessage text={error} />
    </div>
  );
}
