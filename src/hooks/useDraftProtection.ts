import { useEffect, useRef, useState } from 'react';
import { registerNavigationGuard } from './useRoute';

/** In-memory editing protection; a reload uses the browser's native unsaved-changes prompt. */
export function useDraftProtection(dirty: boolean, busy: boolean, close: () => void) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const latest = useRef({ busy, close });
  latest.current = { busy, close };
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', unload);
    const unregister = registerNavigationGuard((accept) => {
      if (latest.current.busy) return;
      pendingNavigation.current = accept;
      setConfirmDiscard(true);
    });
    return () => {
      unregister();
      window.removeEventListener('beforeunload', unload);
    };
  }, [dirty]);
  return {
    confirmDiscard,
    requestClose() {
      if (busy) return;
      if (dirty) setConfirmDiscard(true);
      else close();
    },
    continueEditing() {
      pendingNavigation.current = null;
      setConfirmDiscard(false);
    },
    discard() {
      const accept = pendingNavigation.current;
      pendingNavigation.current = null;
      if (accept) accept();
      else close();
    },
  };
}
