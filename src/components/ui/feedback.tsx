import { tr } from '../../i18n';
import type { ReactNode } from 'react';

export const ErrorMessage = ({ text, id }: { text: string; id?: string }) =>
  text ? (
    <p id={id} role="alert" className="error">
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
