import { tr } from '../../i18n';
import { ArrowUp, ArrowDown } from 'lucide-react';
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
          aria-label={tr('Reducir {label}', {
            label: label.toLowerCase(),
          })}
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
          onChange={(inputEvent) =>
            onChange(Math.min(max, Math.max(min, Number(inputEvent.target.value))))
          }
        />
        <button
          type="button"
          aria-label={tr('Aumentar {label}', {
            label: label.toLowerCase(),
          })}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <ArrowUp size={16} />
        </button>
      </div>
    </div>
  );
}
