import { useEffect, useRef, useState } from 'react';
import { repo } from '../data/database';
import { matchTimeLimitReached } from '../domain/clock';
import type { Match } from '../domain/schema';

/** Runs on every page; no database work until a live snapshot contains an expired match. */
export function useMatchTimeLimit(matches: readonly Match[] | undefined) {
  const saving = useRef(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false;
    const check = async () => {
      if (!matches?.some((match) => matchTimeLimitReached(match))) {
        if (!disposed) setError('');
        return;
      }
      if (saving.current) return;
      saving.current = true;
      try {
        await repo.finishExpiredMatches();
        if (!disposed) setError('');
      } catch (reason) {
        if (!disposed)
          setError(
            reason instanceof Error ? reason.message : 'No se pudo guardar. Inténtalo de nuevo.',
          );
      } finally {
        saving.current = false;
      }
    };
    void check();
    if (!matches?.some((match) => match.deletedAt === null && match.status === 'active')) return;
    const timer = window.setInterval(() => void check(), 1000);
    const wake = () => {
      if (!document.hidden) void check();
    };
    window.addEventListener('focus', wake);
    window.addEventListener('pageshow', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      disposed = true;
      clearInterval(timer);
      window.removeEventListener('focus', wake);
      window.removeEventListener('pageshow', wake);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [matches]);
  return error;
}
