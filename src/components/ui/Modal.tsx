import { useDialogViewport } from '../../hooks/useDialogViewport';
import { tr } from '../../i18n';
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';
export function Modal({
  title,
  children,
  close,
  className = '',
  initialFocus,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  className?: string;
  initialFocus?: RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef(document.activeElement);
  useDialogViewport(dialogRef);
  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    const trigger = triggerRef.current;
    dialog.showModal();
    initialFocus?.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      // Nested dialogs close during the same commit; restore after all have left the top layer.
      queueMicrotask(() => {
        if (
          !(trigger instanceof HTMLElement) ||
          !trigger.isConnected ||
          trigger.matches(':disabled') ||
          trigger.closest('dialog:not([open])')
        )
          return;
        if (
          [...document.querySelectorAll('dialog[open]')].some((dialog) => !dialog.contains(trigger))
        )
          return;
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          active !== document.body &&
          active !== trigger &&
          !dialog.contains(active)
        )
          return;
        trigger.focus({ preventScroll: true });
      });
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className={`modal ${className}`.trim()}
      onCancel={(cancelEvent) => {
        cancelEvent.preventDefault();
        close();
      }}
      aria-label={title}
    >
      <div className="modal-handle" />
      <div className="section-heading">
        <h2>{title}</h2>
        <button type="button" className="icon-button" aria-label={tr('Cerrar')} onClick={close}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
