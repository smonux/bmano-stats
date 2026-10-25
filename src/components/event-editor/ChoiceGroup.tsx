import { useId, type ReactNode } from 'react';

export type Choice = {
  value: string;
  label: string;
  content?: ReactNode;
  accessibleLabel?: string;
  description?: string;
};

/** Native buttons keep each choice reachable by keyboard and expose selection without color. */
export function ChoiceGroup({
  label,
  value,
  options,
  change,
  className = '',
  hint,
}: {
  label: string;
  value: string;
  options: Choice[];
  change: (value: string) => void;
  className?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <fieldset
      className={`choice-group ${className}`}
      aria-labelledby={id}
      aria-describedby={hint ? id + '-hint' : undefined}
    >
      <legend id={id}>{label}</legend>
      <div className="choice-options">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            aria-label={option.accessibleLabel}
            aria-description={option.description}
            aria-pressed={value === option.value}
            className={value === option.value ? 'selected' : ''}
            onClick={() => {
              if (option.value !== value) change(option.value);
            }}
          >
            {option.content ?? option.label}
          </button>
        ))}
      </div>
      {hint && (
        <p className="choice-hint" id={id + '-hint'}>
          {hint}
        </p>
      )}
    </fieldset>
  );
}
