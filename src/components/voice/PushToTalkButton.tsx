import { useEffect, type RefObject } from 'react';
import { Mic } from 'lucide-react';
import { tr } from '../../i18n';
import type { useVoiceCapture } from './useVoiceCapture';

/** Identical pointer/keyboard push-to-talk in matches and isolated practice. */
export function PushToTalkButton({
  capture,
  started,
  buttonRef,
}: {
  capture: Pick<
    ReturnType<typeof useVoiceCapture>,
    'phase' | 'seconds' | 'ready' | 'problem' | 'start' | 'release'
  >;
  started?: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}) {
  const { phase, seconds, ready, problem, start, release } = capture;
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) release();
    };
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [release]);
  return (
    <button
      ref={buttonRef}
      className={`hold-to-talk ${phase === 'recording' ? 'recording' : ''}`}
      aria-label={
        phase === 'recording' ? tr('Grabando · {seconds} s', { seconds }) : tr('Voz (mantener)')
      }
      disabled={
        !ready || Boolean(problem) || ['transcribing', 'interpreting', 'review'].includes(phase)
      }
      aria-disabled={phase === 'permission'}
      onPointerDown={(event) => {
        if (event.button !== 0 || phase !== 'ready') return;
        event.preventDefault();
        started?.();
        event.currentTarget.setPointerCapture(event.pointerId);
        void start();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onKeyDown={(event) => {
        if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
          event.preventDefault();
          if (phase === 'ready') started?.();
          void start();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          release();
        }
      }}
      onBlur={release}
    >
      <Mic size={20} aria-hidden="true" />
      {phase === 'recording'
        ? tr('Grabando · {seconds} s', { seconds })
        : phase === 'permission'
          ? tr('Solicitando permiso…')
          : tr('Voz (mantener)')}
    </button>
  );
}
