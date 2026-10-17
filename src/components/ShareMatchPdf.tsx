import { LoaderCircle, Share2 } from 'lucide-react';
import { tr } from '../i18n';
import type { Snapshot } from '../domain/schema';
import { ErrorMessage } from './ui';
import { useMatchPdf } from './statistics/useMatchPdf';

export function ShareMatchPdf({ data, matchId }: { data: Snapshot; matchId: string }) {
  const { file, error, busy, notice, share, retry } = useMatchPdf(data, matchId);

  return (
    <div className="share-match-pdf">
      <button
        className="primary"
        disabled={(!file && !error) || busy}
        onClick={() => (file ? void share() : retry())}
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
