import { useLayoutEffect, type RefObject } from 'react';

/** Keep dialog bounds inside the visible area when a mobile keyboard opens or pans it. */
export function useDialogViewport(dialog: RefObject<HTMLDialogElement | null>) {
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    let frame: number | undefined;
    const update = () => {
      const element = dialog.current;
      if (!element) {
        return;
      }
      const height = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;
      const bottom = Math.max(0, window.innerHeight - top - height);
      element.style.setProperty('--dialog-viewport-height', `${height}px`);
      element.style.setProperty('--dialog-viewport-top', `${top}px`);
      element.style.setProperty('--dialog-viewport-bottom', `${bottom}px`);
      element.toggleAttribute('data-compact-viewport', height < 360);
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame ?? 0);
      frame = requestAnimationFrame(update);
    };
    update();
    viewport?.addEventListener('resize', scheduleUpdate);
    viewport?.addEventListener('scroll', scheduleUpdate);
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      cancelAnimationFrame(frame ?? 0);
      viewport?.removeEventListener('resize', scheduleUpdate);
      viewport?.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [dialog]);
}
