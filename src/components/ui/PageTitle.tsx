import { tr } from '../../i18n';
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { navigate } from '../../hooks/useRoute';

export function PageTitle({
  title,
  subtitle,
  back = '/',
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  back?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`page-heading ${className}`}>
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
