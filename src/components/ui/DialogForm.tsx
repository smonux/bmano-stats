import { useId, type FormEventHandler, type ReactNode } from 'react';
import { ErrorMessage } from './feedback';

/** A single scrollable body and a persistent action area, also with a mobile keyboard. */
export function DialogForm({
  children,
  actions,
  error,
  errorId,
  busy,
  onSubmit,
}: {
  children: ReactNode;
  actions: ReactNode;
  error: string;
  errorId?: string;
  busy?: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  const generatedId = useId();
  const id = errorId ?? generatedId;
  return (
    <form
      className="dialog-form"
      onSubmit={onSubmit}
      aria-busy={busy || undefined}
      aria-describedby={error ? id : undefined}
    >
      <div className="dialog-fields">{children}</div>
      <footer className="dialog-footer">
        <ErrorMessage id={id} text={error} />
        <div className="actions">{actions}</div>
      </footer>
    </form>
  );
}
