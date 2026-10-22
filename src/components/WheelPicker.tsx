import { useEffect, useId, useLayoutEffect, useRef } from 'react';

const ROW_HEIGHT = 40;
const SCROLL_SETTLE_MS = 100;

export type WheelOption<Value extends string = string> = {
  value: Value;
  label: string;
  disabled?: boolean;
};

type WheelPickerProps<Value extends string> = {
  label: string;
  value: Value;
  options: readonly WheelOption<Value>[];
  change: (value: Value) => void;
  disabled?: boolean;
  hideLabel?: boolean;
};

/** One selection control for touch scrolling, mouse clicks and keyboard navigation. */
export function WheelPicker<Value extends string>({
  label,
  value,
  options,
  change,
  disabled = false,
  hideLabel = false,
}: WheelPickerProps<Value>) {
  const wheel = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const optionId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  // A scroll can finish after the parent changes the value, roster or disabled state.
  const latest = useRef({ options, change, value, disabled });
  latest.current = { options, change, value, disabled };

  useLayoutEffect(() => {
    clearTimeout(scrollTimer.current);
    const element = wheel.current!;
    if (Math.abs(element.scrollTop - selectedIndex * ROW_HEIGHT) > 1) {
      element.scrollTop = selectedIndex * ROW_HEIGHT;
    }
  }, [selectedIndex, value, disabled]);

  useEffect(() => {
    // Dialog layout effects run before showModal makes its contents measurable.
    const frame = requestAnimationFrame(() => {
      wheel.current?.scrollTo({ top: selectedIndex * ROW_HEIGHT });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedIndex, value]);

  useEffect(() => () => clearTimeout(scrollTimer.current), []);

  function selectOption(index: number | undefined) {
    if (index === undefined) {
      return;
    }
    const option = options[index];
    if (disabled || !option || option.disabled) {
      return;
    }
    clearTimeout(scrollTimer.current);
    wheel.current?.scrollTo({ top: index * ROW_HEIGHT });
    if (option.value !== value) {
      change(option.value);
    }
  }

  function commitScroll() {
    const current = latest.current;
    if (current.disabled || !wheel.current) {
      return;
    }
    const centeredIndex = Math.max(
      0,
      Math.min(current.options.length - 1, Math.round(wheel.current.scrollTop / ROW_HEIGHT)),
    );
    const option = current.options[centeredIndex];
    if (option?.disabled) {
      const previousIndex = current.options.findIndex((option) => option.value === current.value);
      wheel.current.scrollTo({ top: Math.max(0, previousIndex) * ROW_HEIGHT });
      return;
    }
    if (option && !option.disabled && option.value !== current.value) {
      current.change(option.value);
    }
  }

  function navigateWithKeyboard(key: string) {
    const selectableIndices = options.flatMap((option, index) => (option.disabled ? [] : [index]));
    if (key === 'Home') {
      selectOption(selectableIndices[0]);
    } else if (key === 'End') {
      selectOption(selectableIndices.at(-1));
    } else if (key === 'ArrowDown') {
      selectOption(selectableIndices.find((index) => index > selectedIndex));
    } else if (key === 'ArrowUp') {
      selectOption(selectableIndices.reverse().find((index) => index < selectedIndex));
    }
  }

  return (
    <div className="wheel-field" data-disabled={disabled || undefined}>
      <span className={hideLabel ? 'sr-only' : 'field-label'}>{label}</span>
      <div className="wheel-shell">
        <div className="wheel-selection" aria-hidden="true" />
        <div
          ref={wheel}
          className="scroll-wheel"
          role="listbox"
          aria-label={label}
          aria-disabled={disabled || undefined}
          aria-activedescendant={options.length ? `${optionId}-${selectedIndex}` : undefined}
          tabIndex={disabled ? -1 : 0}
          onScroll={() => {
            clearTimeout(scrollTimer.current);
            scrollTimer.current = setTimeout(commitScroll, SCROLL_SETTLE_MS);
          }}
          onKeyDown={(event) => {
            if (disabled) {
              return;
            }
            if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
              event.preventDefault();
              navigateWithKeyboard(event.key);
            }
          }}
        >
          {options.map((option, index) => (
            <div
              id={`${optionId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              title={option.label}
              key={option.value}
              onClick={() => {
                selectOption(index);
                if (!disabled) {
                  wheel.current?.focus({ preventScroll: true });
                }
              }}
            >
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
