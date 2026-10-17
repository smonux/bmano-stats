import { tr } from '../i18n';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X, ChevronLeft, ArrowUp, ArrowDown } from 'lucide-react';

export const navigate = (path: string) => {
  location.hash = path;
};
export function useRoute() {
  const [route, setRoute] = useState(location.hash.slice(1) || '/');
  useEffect(() => {
    const fn = () => {
      setRoute(location.hash.slice(1) || '/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return route;
}
export function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false);
  const run = async (action: () => Promise<unknown>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : tr('No se pudo guardar. Inténtalo de nuevo.'));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  return { busy, error, run, setError };
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
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
export function PageTitle({
  title,
  subtitle,
  back = '/',
  children,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <button className="back" onClick={() => navigate(back)}>
          <ChevronLeft size={16} /> {tr('Volver')}
        </button>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
export const ErrorMessage = ({ text }: { text: string }) =>
  text ? (
    <p role="alert" className="error">
      {tr(text)}
    </p>
  ) : null;
export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-symbol">＋</div>
      <h3>{title}</h3>
      <div className="muted">{children}</div>
    </div>
  );
}
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
  const a = useAction();
  return (
    <Modal title={title} close={() => !a.busy && close()}>
      <p>{tr(text)}</p>
      <ErrorMessage text={a.error} />
      <div className="actions">
        <button disabled={a.busy} onClick={close}>
          {tr('Cancelar')}
        </button>
        <button
          className={danger ? 'danger' : 'primary'}
          disabled={a.busy}
          onClick={() =>
            a.run(async () => {
              await confirm();
              close();
            })
          }
        >
          {a.busy ? tr('Guardando…') : tr('Confirmar')}
        </button>
      </div>
    </Modal>
  );
}
export function NumberWheel({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="number-wheel">
      <span className="field-label">{label}</span>
      <div>
        <button
          type="button"
          aria-label={tr('Reducir {label}', { label: label.toLowerCase() })}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <ArrowDown size={16} />
        </button>
        <input
          aria-label={label}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
        />
        <button
          type="button"
          aria-label={tr('Aumentar {label}', { label: label.toLowerCase() })}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <ArrowUp size={16} />
        </button>
      </div>
    </div>
  );
}
