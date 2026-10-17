import { useEffect, useRef, useState } from 'react';
import { lockPortrait } from '../device/orientation';
import { tr } from '../i18n';
export function usePortraitOrientation() {
  const [locked, setLocked] = useState(false);
  const [notice, setNotice] = useState('');
  const mounted = useRef(true);
  const requesting = useRef(false);
  const operation = useRef(0);
  useEffect(() => {
    mounted.current = true;
    const apply = async () => {
      if (requesting.current) {
        return;
      }
      const attempt = ++operation.current;
      const applied = await lockPortrait();
      if (mounted.current && attempt === operation.current) {
        setLocked(applied);
      }
    };
    const fullscreenChanged = () => {
      if (document.fullscreenElement) {
        void apply();
      } else {
        setLocked(false);
      }
    };
    void apply();
    screen.orientation?.addEventListener('change', apply);
    document.addEventListener('fullscreenchange', fullscreenChanged);
    return () => {
      mounted.current = false;
      screen.orientation?.removeEventListener('change', apply);
      document.removeEventListener('fullscreenchange', fullscreenChanged);
    };
  }, []);
  async function requestLock() {
    if (requesting.current) {
      return;
    }
    requesting.current = true;
    ++operation.current;
    const applied = await lockPortrait(true);
    requesting.current = false;
    if (!mounted.current) {
      return;
    }
    setLocked(applied);
    setNotice(
      applied
        ? ''
        : tr(
            'Este navegador no permite fijar la orientación. Usa el bloqueo vertical del dispositivo; la edición y el audio se conservan al girar.',
          ),
    );
  }
  return {
    locked,
    notice,
    requestLock,
    dismissNotice: () => setNotice(''),
  };
}
