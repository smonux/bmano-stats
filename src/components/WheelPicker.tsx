import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';

const SCROLL_SETTLE_MS = 100;

/** Read the rendered row so text enlargement and CSS geometry stay in sync. */
function rowHeight(wheel: HTMLDivElement) {
  return wheel.querySelector<HTMLElement>('[role="option"]')?.getBoundingClientRect().height ?? 0;
}

function alignSelection(wheel: HTMLDivElement, index: number) {
  const height = rowHeight(wheel);
  if (height > 0 && Math.abs(wheel.scrollTop - index * height) > 1) {
    wheel.scrollTop = index * height;
  }
}

function revealSelection(wheel: HTMLDivElement) {
  const body = wheel.closest<HTMLElement>('.dialog-fields, .event-editor-fields');
  const row = wheel.querySelector<HTMLElement>('[aria-selected="true"]');
  if (!body || !row) return;
  const bounds = body.getBoundingClientRect(),
    selected = row.getBoundingClientRect();
  if (selected.top < bounds.top) body.scrollTop += selected.top - bounds.top;
  else if (selected.bottom > bounds.bottom) body.scrollTop += selected.bottom - bounds.bottom;
}

export type WheelOption<Value extends string = string> = {
  value: Value;
  label: string;
  icon?: ReactNode;
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
  const pointerFocus = useRef(false);
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
    alignSelection(element, selectedIndex);
  }, [selectedIndex, value, disabled]);

  useEffect(() => {
    // Dialog layout effects run before showModal makes its contents measurable.
    const frame = requestAnimationFrame(() => {
      if (wheel.current) {
        alignSelection(wheel.current, selectedIndex);
        if (document.activeElement === wheel.current) revealSelection(wheel.current);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedIndex, value]);

  useEffect(() => () => clearTimeout(scrollTimer.current), []);

  useEffect(() => {
    const element = wheel.current!;
    const observer = new ResizeObserver(() => {
      clearTimeout(scrollTimer.current);
      const current = latest.current;
      alignSelection(
        element,
        Math.max(
          0,
          current.options.findIndex((option) => option.value === current.value),
        ),
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function selectOption(index: number | undefined) {
    if (index === undefined) {
      return;
    }
    const option = options[index];
    if (disabled || !option || option.disabled) {
      return;
    }
    clearTimeout(scrollTimer.current);
    if (wheel.current) alignSelection(wheel.current, index);
    if (option.value !== value) {
      change(option.value);
    }
  }

  function commitScroll() {
    const current = latest.current;
    if (current.disabled || !wheel.current) {
      return;
    }
    const height = rowHeight(wheel.current);
    if (height === 0) return;
    const centeredIndex = Math.max(
      0,
      Math.min(current.options.length - 1, Math.round(wheel.current.scrollTop / height)),
    );
    const option = current.options[centeredIndex];
    if (option?.disabled) {
      const previousIndex = current.options.findIndex((option) => option.value === current.value);
      alignSelection(wheel.current, Math.max(0, previousIndex));
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
          onFocus={() => {
            // Do not move the row between pointer-down and click.
            if (pointerFocus.current) return;
            requestAnimationFrame(() => {
              if (wheel.current) revealSelection(wheel.current);
            });
          }}
          onPointerDown={() => {
            if (!disabled) {
              pointerFocus.current = true;
              wheel.current?.focus({ preventScroll: true });
              pointerFocus.current = false;
            }
          }}
          onBlur={() => {
            clearTimeout(scrollTimer.current);
            commitScroll();
          }}
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
              {option.icon && (
                <span className="wheel-option-icon" aria-hidden="true">
                  {option.icon}
                </span>
              )}
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
