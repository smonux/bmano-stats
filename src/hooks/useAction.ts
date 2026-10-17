import { useRef, useState } from 'react';
import { tr } from '../i18n';

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const run = async (action: () => Promise<unknown>) => {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : tr('No se pudo guardar. Inténtalo de nuevo.'),
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  return { busy, error, run, setError };
}
