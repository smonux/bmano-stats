import { useCallback, useEffect, useRef, useState } from 'react';
import { ExclusionAlert } from '../../audio/exclusion-alert';
import { tr } from '../../i18n';

export function useExclusionSound() {
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const alert = useRef<ExclusionAlert | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      void alert.current?.close();
    };
  }, []);

  const prepare = useCallback(async () => {
    try {
      alert.current ??= new ExclusionAlert();
      await alert.current.prepare();
      if (alive.current) {
        setReady(true);
        setError('');
      }
    } catch {
      if (alive.current) {
        setError(tr('No se pudo activar el sonido.'));
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const unlock = () => void prepare();
    // A restored timer can expire without another timer button being pressed.
    // Unlock sound on any courtside interaction, including keyboard navigation.
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
    return () => {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
    };
  }, [enabled, prepare]);

  const notify = useCallback(() => {
    if (!enabled) {
      return true;
    }
    if (!ready) {
      // Keep an expired timer pending until a gesture permits browser audio.
      return false;
    }
    return alert.current?.play() ?? false;
  }, [enabled, ready]);

  function toggle() {
    setEnabled(!enabled);
    setError('');
    if (enabled) {
      alert.current?.silence();
    } else {
      void prepare();
    }
  }

  return { enabled, error, notify, toggle };
}
