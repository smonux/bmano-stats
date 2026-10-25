import { useRef, type ReactNode } from 'react';
import { tr } from '../../i18n';
import { Modal } from './Modal';
import { ErrorMessage } from './feedback';
import { useAction } from '../../hooks/useAction';

export function Confirm({
  title,
  text,
  confirm,
  close,
  danger = false,
  actionLabel,
  cancelLabel,
  context,
}: {
  title: string;
  text: string;
  confirm: () => Promise<unknown>;
  close: () => void;
  danger?: boolean;
  actionLabel?: string;
  cancelLabel?: string;
  context?: ReactNode;
}) {
  const action = useAction();
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <Modal initialFocus={cancel} title={title} close={() => !action.busy && close()}>
      {context && <div className="confirmation-context">{context}</div>}
      <p>{tr(text)}</p>
      <ErrorMessage text={action.error} />
      <div className="actions">
        <button ref={cancel} type="button" disabled={action.busy} onClick={close}>
          {cancelLabel ?? tr('Cancelar')}
        </button>
        <button
          className={danger ? 'danger' : 'primary'}
          disabled={action.busy}
          onClick={() =>
            action.run(async () => {
              await confirm();
              close();
            })
          }
        >
          {action.busy ? tr('Guardando…') : (actionLabel ?? tr('Confirmar'))}
        </button>
      </div>
    </Modal>
  );
}
