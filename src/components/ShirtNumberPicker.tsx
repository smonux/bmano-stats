import { tr } from '../i18n';
import { WheelPicker } from './WheelPicker';

const digits = [
  { value: '', label: '—' },
  ...Array.from({ length: 10 }, (_, number) => ({ value: String(number), label: String(number) })),
];

/** Both digits and the roster wheel use the parent's single shirt-number value. */
export function ShirtNumberPicker({
  label,
  value,
  change,
  disabled = false,
  hideLabel = false,
}: {
  label: string;
  value: string;
  change: (number: string) => void;
  disabled?: boolean;
  hideLabel?: boolean;
}) {
  const number = value === '' ? '' : String(Number(value)).padStart(2, '0');
  function changeDigit(position: 0 | 1, digit: string) {
    if (digit === '') {
      change('');
      return;
    }
    const next = (number || '00').split('');
    next[position] = digit;
    change(String(Number(next.join(''))));
  }
  return (
    <fieldset className="shirt-number-picker" disabled={disabled}>
      <legend className={hideLabel ? 'sr-only' : 'field-label'}>{label}</legend>
      <div className="shirt-number-digits">
        <WheelPicker
          label={`${label} · ${tr('Decenas')}`}
          hideLabel
          value={number[0] ?? ''}
          options={digits}
          disabled={disabled}
          change={(digit) => changeDigit(0, digit)}
        />
        <WheelPicker
          label={`${label} · ${tr('Unidades')}`}
          hideLabel
          value={number[1] ?? ''}
          options={digits}
          disabled={disabled}
          change={(digit) => changeDigit(1, digit)}
        />
      </div>
    </fieldset>
  );
}
