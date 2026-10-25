import type { ReactNode } from 'react';

/** One Tab stop; arrows activate and focus the next tab, including wrap-around. */
export function TabBar({
  id,
  label,
  value,
  tabs,
  change,
  className = '',
}: {
  id: string;
  label: string;
  value: string;
  tabs: { value: string; label: ReactNode }[];
  change: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`tabs ${className}`} role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab.value}
          type="button"
          id={`${id}-tab-${tab.value}`}
          role="tab"
          aria-selected={value === tab.value}
          aria-controls={`${id}-panel-${tab.value}`}
          tabIndex={value === tab.value ? 0 : -1}
          className={value === tab.value ? 'selected' : ''}
          onClick={() => change(tab.value)}
          onKeyDown={(event) => {
            let next: number;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            else return;
            event.preventDefault();
            change(tabs[next].value);
            document.getElementById(`${id}-tab-${tabs[next].value}`)?.focus();
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({
  id,
  value,
  selected,
  children,
}: {
  id: string;
  value: string;
  selected: string;
  children: ReactNode;
}) {
  return (
    <section
      role="tabpanel"
      id={`${id}-panel-${value}`}
      aria-labelledby={`${id}-tab-${value}`}
      hidden={selected !== value}
      tabIndex={0}
    >
      {selected === value ? children : null}
    </section>
  );
}
