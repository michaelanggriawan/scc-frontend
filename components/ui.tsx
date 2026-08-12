'use client';

import {
  ReactNode,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { InquiryStatus, EntityStatus } from '@/lib/types';

// ─── Icons ─────────────────────────────────────────────────────────────────
// One hand-drawn line set (24×24, 1.5 stroke) so every icon in the product
// shares the same weight — no mixed libraries, no placeholder gray boxes.

const ICON_PATHS: Record<string, ReactNode> = {
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.25" />
      <path d="M2.75 20c.6-3.6 3.3-6 6.25-6s5.65 2.4 6.25 6" strokeLinecap="round" />
      <path d="M15.5 5.6a3.25 3.25 0 0 1 0 6.3M21.25 20c-.42-2.5-1.75-4.4-3.6-5.4" strokeLinecap="round" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2.75" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" strokeLinecap="round" />
    </>
  ),
  screen: (
    <>
      <rect x="2.75" y="4" width="18.5" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" strokeLinecap="round" />
    </>
  ),
  speaker: (
    <>
      <path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z" strokeLinejoin="round" />
      <path d="M16.2 8.3a5.5 5.5 0 0 1 0 7.4M18.8 5.8a9 9 0 0 1 0 12.4" strokeLinecap="round" />
    </>
  ),
  spotlight: (
    <>
      <path d="M8 3h8l2.5 6H5.5z" strokeLinejoin="round" />
      <path d="M6 9l-2.5 11M18 9l2.5 11M9.5 9v3M14.5 9v3" strokeLinecap="round" />
    </>
  ),
  shield: (
    <path
      d="M12 2.75 19.5 5.5v6c0 5-3.2 8.3-7.5 9.75C7.7 19.8 4.5 16.5 4.5 11.5v-6z"
      strokeLinejoin="round"
    />
  ),
  spark: (
    <path
      d="M12 2.5c.6 4 2.6 6 6.5 6.6-3.9.6-5.9 2.6-6.5 6.6-.6-4-2.6-6-6.5-6.6 3.9-.6 5.9-2.6 6.5-6.6ZM19 16.5c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3Z"
      strokeLinejoin="round"
    />
  ),
  handshake: (
    <>
      <path d="M2.75 12.5 7 8.3l3.4 2.1 2-2 5.4 5.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 8.3 3.5 11.8M21.25 12.5 17.8 16l-2.3-2.1M9.5 15l2 2c.7.7 1.9.7 2.6 0" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  check: <path d="M4.5 12.5 9 17l10.5-10.5" strokeLinecap="round" strokeLinejoin="round" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M8 12.3 10.8 15l5.2-6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  alert: (
    <>
      <path d="M12 2.75 22 20.5H2z" strokeLinejoin="round" />
      <path d="M12 9.5v5M12 17.5v.1" strokeLinecap="round" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 11v5.5M12 7.8v.1" strokeLinecap="round" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21.25S4.75 14.4 4.75 9.5a7.25 7.25 0 0 1 14.5 0c0 4.9-7.25 11.75-7.25 11.75Z" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  phone: (
    <path
      d="M5 3.5h3.3l1.4 4.4-2.1 1.7a12.5 12.5 0 0 0 6.8 6.8l1.7-2.1 4.4 1.4V19a1.5 1.5 0 0 1-1.6 1.5C11.2 19.9 4.1 12.8 3.5 6.1A1.5 1.5 0 0 1 5 4.5Z"
      strokeLinejoin="round"
    />
  ),
  mail: (
    <>
      <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="1.5" />
      <path d="m3.5 6 8.5 6.5L20.5 6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  whatsapp: (
    <path
      d="M12 2.75a9.25 9.25 0 0 0-8 13.9L2.75 21l4.5-1.2A9.25 9.25 0 1 0 12 2.75Zm4.9 12.9c-.2.6-1.2 1.1-1.9 1.2-.5.1-1.1.1-3.5-.9-2.9-1.2-4.8-4.1-4.9-4.3-.1-.2-1.2-1.6-1.2-3 0-1.4.7-2.1 1-2.4.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5.2.6.7 1.9.8 2 .1.2.1.4 0 .6-.5 1-1 .9-.5 1.7.7 1.2 1.5 1.9 2.6 2.5.2.1.4.1.5-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.9.3.1.5.2.5.3.1.2.1.5-.1 1.1Z"
      strokeLinejoin="round"
    />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <path
      d="M15 3h-2.4C10.4 3 9 4.6 9 7v2.4H7V13h2v8h3.4v-8h2.5l.4-3.6h-2.9V7.4c0-.8.3-1.4 1.4-1.4H15Z"
      strokeLinejoin="round"
    />
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7.5 10.2v6.3M7.5 7.5v.1M11.2 16.5v-3.7c0-1.5.9-2.4 2.1-2.4 1.2 0 1.9.9 1.9 2.4v3.7" strokeLinecap="round" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.75" y="5.5" width="18.5" height="13" rx="3" />
      <path d="M10.5 9.5v5l4.3-2.5z" strokeLinejoin="round" fill="currentColor" />
    </>
  ),
  arrowRight: <path d="M4 12h15.5M13 5.5 19.5 12 13 18.5" strokeLinecap="round" strokeLinejoin="round" />,
  chevronDown: <path d="m5.5 8.5 6.5 6.5 6.5-6.5" strokeLinecap="round" strokeLinejoin="round" />,
  chevronUp: <path d="m5.5 15.5 6.5-6.5 6.5 6.5" strokeLinecap="round" strokeLinejoin="round" />,
  close: <path d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5" strokeLinecap="round" />,
  menu: <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" strokeLinecap="round" />,
  upload: (
    <>
      <path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 15.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.5" strokeLinecap="round" />
    </>
  ),
  fileText: (
    <>
      <path d="M6.5 2.75h7.7L18 7.35V21.25h-11.5Z" strokeLinejoin="round" />
      <path d="M14 2.75v4.9H18M9 12h6M9 15.5h6M9 8.5h2.5" strokeLinecap="round" />
    </>
  ),
  creditCard: (
    <>
      <rect x="2.75" y="5.5" width="18.5" height="13" rx="2" />
      <path d="M2.75 9.75h18.5M6 15h3.5" strokeLinecap="round" />
    </>
  ),
  image: (
    <>
      <rect x="2.75" y="4.5" width="18.5" height="15" rx="1.75" />
      <circle cx="8.3" cy="9.5" r="1.6" />
      <path d="m4.5 17.5 5-5.3 3.4 3.2 2.4-2.6 4.2 4.7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.75" />
      <path d="m20 20-4.35-4.35" strokeLinecap="round" />
    </>
  ),
  filter: <path d="M3.5 5h17L14 12.7v6l-4 2v-8Z" strokeLinejoin="round" />,
  pencil: (
    <path
      d="m4 20 .8-4L16.4 4.4a1.9 1.9 0 0 1 2.7 0l.5.5a1.9 1.9 0 0 1 0 2.7L8 19.2Z"
      strokeLinejoin="round"
    />
  ),
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.75h5V7" strokeLinecap="round" />
      <path d="M6.5 7 7.4 20h9.2L17.5 7" strokeLinejoin="round" />
      <path d="M10 11v5.5M14 11v5.5" strokeLinecap="round" />
    </>
  ),
  plus: <path d="M12 4.5v15M4.5 12h15" strokeLinecap="round" />,
  building: (
    <>
      <rect x="4.5" y="3" width="10" height="18" rx="1" />
      <rect x="14.5" y="9" width="5" height="12" rx="1" />
      <path d="M7.5 6.5h1M10.5 6.5h1M7.5 10h1M10.5 10h1M7.5 13.5h1M10.5 13.5h1M7.5 17h1M10.5 17h1" strokeLinecap="round" />
    </>
  ),
  car: (
    <>
      <path d="M4 16V11l2-4.5h12L20 11v5" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M3.25 16h17.5v2.5a1 1 0 0 1-1 1H17a1 1 0 0 1-1-1V17H8v1.5a1 1 0 0 1-1 1H4.25a1 1 0 0 1-1-1Z" strokeLinejoin="round" />
      <circle cx="7.5" cy="16" r="1.4" />
      <circle cx="16.5" cy="16" r="1.4" />
    </>
  ),
  wifi: (
    <>
      <path d="M4 9.3a12 12 0 0 1 16 0M6.8 12.9a8 8 0 0 1 10.4 0M9.7 16.4a4 4 0 0 1 4.6 0" strokeLinecap="round" />
      <circle cx="12" cy="19.3" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  plug: (
    <path
      d="M9 2.5v5M15 2.5v5M6.5 7.5h11v3.5a5.5 5.5 0 0 1-11 0ZM12 16.5v5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  camera: (
    <>
      <path d="M4 8h3.2L9 5.5h6L16.8 8H20a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-4 3.8-6.5 7.5-6.5S18.5 16 19.5 20" strokeLinecap="round" />
    </>
  ),
  logout: (
    <>
      <path d="M9 20H5.5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5.5 4H9" strokeLinecap="round" />
      <path d="M16 16.5 20.5 12 16 7.5M20.5 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  arrowLeft: <path d="M20 12H4.5M11 5.5 4.5 12 11 18.5" strokeLinecap="round" strokeLinejoin="round" />,
  bell: (
    <>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" strokeLinejoin="round" />
      <path d="M9.75 18.5a2.25 2.25 0 0 0 4.5 0" strokeLinecap="round" />
    </>
  ),
  gripVertical: (
    <>
      <circle cx="9" cy="6" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
};

export function Icon({
  name,
  className = 'w-5 h-5',
  strokeWidth = 1.5,
}: {
  name: keyof typeof ICON_PATHS;
  className?: string;
  strokeWidth?: number;
}) {
  const path = ICON_PATHS[name];
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

// ─── Primitives ──────────────────────────────────────────────────────────────

export function PhotoBox({
  label,
  className = '',
  icon = 'image',
}: {
  label?: string;
  className?: string;
  icon?: keyof typeof ICON_PATHS;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-[linear-gradient(150deg,#ffffff_0%,var(--color-cream)_100%)] ${className}`}
    >
      <div className="grain-overlay" />
      <div className="absolute inset-3 border border-[var(--surface-border)]" />
      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <Icon name={icon} className="w-6 h-6 text-gold-dim" />
        {label && (
          <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--text-muted)] leading-snug">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export function IconBox({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block flex-shrink-0 rotate-45 bg-gold shadow-gold ${className}`}
    />
  );
}

export function Btn({
  children,
  full = false,
  sm = false,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
}: {
  children: ReactNode;
  full?: boolean;
  sm?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'relative inline-flex items-center justify-center gap-2 font-semibold tracking-[0.02em] cursor-pointer',
        'bg-[linear-gradient(155deg,var(--color-gold-light),var(--color-gold)_55%,var(--color-gold-dim))]',
        'text-mahogany-2 transition-all duration-200 ease-out',
        disabled
          ? 'opacity-40 cursor-not-allowed grayscale'
          : 'hover:shadow-[0_6px_20px_-4px_rgba(201,162,39,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
        sm ? 'px-4 py-2 text-xs' : 'px-7 py-3 text-sm',
        full ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function OutlineBtn({
  children,
  full = false,
  sm = false,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
}: {
  children: ReactNode;
  full?: boolean;
  sm?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 border font-semibold tracking-[0.02em] cursor-pointer',
        'border-mahogany/40 bg-transparent text-mahogany transition-all duration-200 ease-out',
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:border-mahogany hover:bg-mahogany/5',
        sm ? 'px-4 py-2 text-xs' : 'px-7 py-3 text-sm',
        full ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function SLabel({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-dim mb-3">
      <span className="w-6 h-px bg-mahogany/50" />
      {children}
    </p>
  );
}

export function SWrap({
  children,
  className = '',
  bg = '',
}: {
  children: ReactNode;
  className?: string;
  bg?: string;
}) {
  return (
    <section className={`px-6 md:px-16 py-16 md:py-24 ${bg}`}>
      <div className={`max-w-screen-xl mx-auto ${className}`}>{children}</div>
    </section>
  );
}

// Fades and lifts content into place the first time it scrolls into view.
// `className` becomes the rendered element's full class list, so this can
// wrap (or replace) a card/section container directly — no extra DOM layer.
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-[var(--surface-border)]" />
      <IconBox className="w-1.5 h-1.5" />
      <span className="h-px flex-1 bg-[var(--surface-border)]" />
    </div>
  );
}

// Labelled text input
export function TextField({
  label,
  error,
  className = '',
  ...props
}: {
  label: string;
  error?: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
        {label}
      </span>
      <input
        {...props}
        className={`border bg-[var(--field-bg)] h-11 px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--field-placeholder)] outline-none transition-colors duration-150 ${
          error
            ? 'border-danger focus:border-danger'
            : 'border-[var(--field-border)] focus:border-gold'
        } ${className}`}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

export function TextArea({
  label,
  error,
  className = '',
  ...props
}: {
  label: string;
  error?: string;
  className?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
        {label}
      </span>
      <textarea
        {...props}
        className={`border bg-[var(--field-bg)] px-3.5 py-3 text-sm text-[var(--text-primary)] min-h-[110px] placeholder:text-[var(--field-placeholder)] outline-none transition-colors duration-150 ${
          error
            ? 'border-danger focus:border-danger'
            : 'border-[var(--field-border)] focus:border-gold'
        } ${className}`}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

export function Select({
  label,
  error,
  className = '',
  children,
  ...props
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
        {label}
      </span>
      <div className="relative">
        <select
          {...props}
          className={`w-full appearance-none border bg-[var(--field-bg)] h-11 pl-3.5 pr-9 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 ${
            error
              ? 'border-danger focus:border-danger'
              : 'border-[var(--field-border)] focus:border-gold'
          } ${className}`}
        >
          {children}
        </select>
        <Icon
          name="chevronDown"
          className="w-4 h-4 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

// Counts up from 0 to the numeric portion(s) of `value` once it scrolls into
// view (e.g. "1008 m²" -> animates 1008, "14m × 8m" -> animates both 14 and 8).
export function AnimatedStat({
  value,
  className = '',
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [display, setDisplay] = useState(() => value.replace(/\d+/g, '0'));
  const played = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function animate() {
      const targets = [...value.matchAll(/\d+/g)].map((m) => ({
        num: parseInt(m[0], 10),
        index: m.index!,
        length: m[0].length,
      }));
      const duration = 1200;
      const start = performance.now();

      function tick(now: number) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        let result = value;
        for (let i = targets.length - 1; i >= 0; i--) {
          const t = targets[i];
          const current = Math.round(t.num * eased);
          result = result.slice(0, t.index) + current + result.slice(t.index + t.length);
        }
        setDisplay(result);
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !played.current) {
          played.current = true;
          animate();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <p ref={ref} className={className}>
      {display}
    </p>
  );
}

// ─── Status badges ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  'New Inquiry': 'border-[var(--surface-border-strong)] text-[var(--text-primary)]',
  'Awaiting Payment': 'border-gold bg-gold text-mahogany-2',
  'Payment Submitted': 'border-gold text-gold-dim bg-gold/10',
  'Payment Rejected': 'border-danger/60 text-danger line-through',
  Confirmed: 'border-success bg-success text-cream',
  Cancelled: 'border-[var(--text-muted)] text-[var(--text-muted)]',
};

export function StatusBadge({ status }: { status: InquiryStatus | string }) {
  return (
    <span
      className={`text-[10px] font-semibold px-2.5 py-1 border whitespace-nowrap inline-block tracking-wide ${
        STATUS_STYLES[status] ?? 'border-[var(--surface-border-strong)] text-[var(--text-primary)]'
      }`}
    >
      {status}
    </span>
  );
}

export function StatusPill({ status }: { status: EntityStatus }) {
  return (
    <span
      className={`text-[10px] font-semibold px-2.5 py-1 border whitespace-nowrap inline-block tracking-wide ${
        status === 'Active'
          ? 'border-success bg-success text-cream'
          : 'border-[var(--text-muted)] text-[var(--text-muted)]'
      }`}
    >
      {status}
    </span>
  );
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-[var(--text-muted)]">
      <span className="w-8 h-8 rounded-full border-2 border-[var(--surface-border)] border-t-gold animate-spin" />
      {label}
    </div>
  );
}

export function Alert({
  kind = 'error',
  children,
}: {
  kind?: 'error' | 'success' | 'info';
  children: ReactNode;
}) {
  if (!children) return null;
  const styles =
    kind === 'error'
      ? 'border-danger/50 text-danger bg-danger/10'
      : kind === 'success'
        ? 'border-success/50 text-success bg-success/10'
        : 'border-[var(--surface-border)] text-[var(--text-muted)] bg-[var(--surface)]';
  const icon = kind === 'error' ? 'alert' : kind === 'success' ? 'checkCircle' : 'info';
  return (
    <div className={`flex items-start gap-2.5 border px-4 py-3 text-xs leading-relaxed ${styles}`}>
      <Icon name={icon} className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-mahogany-2/60 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <div
        className="relative w-[420px] max-w-full border border-[var(--surface-border)] bg-[var(--surface)] p-8 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="absolute top-0 left-8 right-8 h-px bg-[linear-gradient(90deg,transparent,var(--color-gold),transparent)]" />
        {children}
      </div>
    </div>
  );
}
