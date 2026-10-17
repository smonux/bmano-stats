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
}: {
  title: string;
  text: string;
  confirm: () => Promise<unknown>;
  close: () => void;
  danger?: boolean;
}) {
  const action = useAction();
  return (
    <Modal title={title} close={() => !action.busy && close()}>
      <p>{tr(text)}</p>
      <ErrorMessage text={action.error} />
      <div className="actions">
        <button disabled={action.busy} onClick={close}>
          {tr('Cancelar')}
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
          {action.busy ? tr('Guardando…') : tr('Confirmar')}
        </button>
      </div>
    </Modal>
  );
}
