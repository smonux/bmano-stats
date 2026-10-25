import type { ReactNode } from 'react';
import type { EventType } from '../domain/event-definitions';

// Vector artwork from docs/ui-hmi/icons. Text labels belong to the surrounding control/card.
const drawings = {
  goal: (
    <>
      <path d="M3 25V7h22v7 M3 11h22 M8 7v18 M14 7v11 M20 7v7 M3 17h13 M3 23h9 M17 23h-5m0 0 3-3m-3 3 3 3" />
      <circle cx="24" cy="24" r="5.5" />
      <path
        transform="translate(24 24)"
        strokeWidth="1.7"
        d="M-2-1 0-3 3-1 2 2-1 3-2-1 M0-3 0-5.5 M3-1 5.3-2 M2 2 3.7 4 M-1 3-2 5 M-2-1-5-2"
      />
    </>
  ),
  save: (
    <>
      <path d="M12 27c-4-2-6-5-6-9v-4a2 2 0 0 1 4 0v3-9a2 2 0 0 1 4 0v8-11a2 2 0 0 1 4 0v11-8a2 2 0 0 1 4 0v9" />
      <circle cx="25" cy="24" r="5.5" />
      <path
        transform="translate(25 24)"
        strokeWidth="1.7"
        d="M-2-1 0-3 3-1 2 2-1 3-2-1 M0-3 0-5.5 M3-1 5.3-2 M2 2 3.7 4 M-1 3-2 5 M-2-1-5-2"
      />
    </>
  ),
  miss: (
    <>
      <path d="M3 27V11h16v16 M3 16h16 M8 11v16 M14 11v16 M3 22h16 M22 13l6 6m0-6-6 6" />
      <circle cx="25" cy="6" r="4.4" />
    </>
  ),
  loss: (
    <>
      <circle cx="8" cy="16" r="5.5" />
      <path d="M17 16h12m-5-5 5 5-5 5" />
      <path
        transform="translate(8 16)"
        strokeWidth="1.7"
        d="M-2-1 0-3 3-1 2 2-1 3-2-1 M0-3 0-5.5 M3-1 5.3-2 M2 2 3.7 4 M-1 3-2 5 M-2-1-5-2"
      />
    </>
  ),
  recovery: (
    <>
      <circle cx="8" cy="16" r="5.5" />
      <path d="M29 16H17m5-5-5 5 5 5" />
      <path
        transform="translate(8 16)"
        strokeWidth="1.7"
        d="M-2-1 0-3 3-1 2 2-1 3-2-1 M0-3 0-5.5 M3-1 5.3-2 M2 2 3.7 4 M-1 3-2 5 M-2-1-5-2"
      />
    </>
  ),
  penalty: (
    <>
      <circle cx="16" cy="16" r="13" />
      <path d="M7 11h7l-5 11 M18 21v-7c0-3 4-3 4 0v7-7c0-3 4-3 4 0v7" />
    </>
  ),
  exclusion: (
    <>
      <circle cx="16" cy="19" r="11" />
      <path d="M12 3h8 M16 3v5 M24 8l3-3 M12 16c0-5 8-5 8 0 0 3-8 5-8 8h8 M23 13v3" />
    </>
  ),
  yellow: (
    <>
      <rect x="8" y="3" width="16" height="26" rx="3" />
      <path d="M16 10v8 M16 23h.01" />
    </>
  ),
  disqualification: (
    <>
      <rect x="8" y="3" width="16" height="26" rx="3" />
      <path d="m12 12 8 8m0-8-8 8" />
    </>
  ),
  passive: (
    <>
      <path d="M11 29v-3c-4-3-6-6-6-10a2 2 0 0 1 4 0v1V8a2 2 0 0 1 4 0v7V5a2 2 0 0 1 4 0v10V7a2 2 0 0 1 4 0v9-5a2 2 0 0 1 4 0v8c0 4-2 6-4 8v2" />
    </>
  ),
  infraction: (
    <>
      <path d="M15 12h14v7H18a7 7 0 1 1-3-7Z" />
      <circle cx="11" cy="19" r="2.5" />
      <path d="M20 5v3 M26 6l-2 3 M14 6l2 3" />
    </>
  ),
  substitution: (
    <>
      <path d="M4 10h23m-6-6 6 6-6 6 M28 23H5m6-6-6 6 6 6" />
    </>
  ),
  note: (
    <>
      <path d="M6 4h20a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H13l-8 5v-5a3 3 0 0 1-2-3V7a3 3 0 0 1 3-3Z M9 11h14 M9 17h10" />
    </>
  ),
} satisfies Record<EventType, ReactNode>;

/** Decorative icon: the adjacent event label supplies its accessible name. */
export function EventIcon({ type }: { type: EventType }) {
  return (
    <svg
      className="event-symbol"
      width="24"
      height="24"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {drawings[type]}
    </svg>
  );
}
