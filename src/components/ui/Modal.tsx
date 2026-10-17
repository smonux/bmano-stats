import { useDialogViewport } from '../../hooks/useDialogViewport';
import { tr } from '../../i18n';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({
  title,
  children,
  close,
  className = '',
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogViewport(dialogRef);
  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    return () => {
      dialog.close();
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
