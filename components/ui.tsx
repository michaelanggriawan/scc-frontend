'use client';

import {
  ReactNode,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { InquiryStatus, EntityStatus } from '@/lib/types';

// ─── Primitives (ported from SCC 2/src/app/App.tsx) ──────────────────────────

export function PhotoBox({
  label,
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-[#D1D1D1] flex items-center justify-center ${className}`}
    >
      {label && (
        <span className="text-[#666] text-[10px] font-normal tracking-wide text-center px-2 leading-snug">
          {label}
        </span>
      )}
    </div>
  );
}

export function IconBox({ className = '' }: { className?: string }) {
  return <div className={`bg-[#C8C8C8] flex-shrink-0 ${className}`} />;
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
        'bg-[#222] text-white font-semibold',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-black',
        sm ? 'px-4 py-2 text-xs' : 'px-6 py-3 text-sm',
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
        'border border-[#222] bg-white text-[#222] font-semibold',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[#F5F5F5]',
        sm ? 'px-4 py-2 text-xs' : 'px-6 py-3 text-sm',
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
    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888] mb-1">
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
    <section className={`px-6 md:px-16 py-16 ${bg}`}>
      <div className={`max-w-screen-xl mx-auto ${className}`}>{children}</div>
    </section>
  );
}

// Labelled text input
export function TextField({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
        {label}
      </span>
      <input
        {...props}
        className="border border-[#AAAAAA] bg-white h-10 px-3 text-sm text-[#333] placeholder:text-[#AAAAAA] focus:border-[#222] outline-none"
      />
    </label>
  );
}

export function TextArea({
  label,
  ...props
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
        {label}
      </span>
      <textarea
        {...props}
        className="border border-[#AAAAAA] bg-white px-3 py-2 text-sm text-[#333] min-h-[100px] placeholder:text-[#AAAAAA] focus:border-[#222] outline-none"
      />
    </label>
  );
}

// Counts up from 0 to the numeric portion(s) of `value` once it scrolls into
// view (e.g. "1008 m²" -> animates 1008, "14m × 8m" -> animates both 14 and 8).
export function AnimatedStat({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [display, setDisplay] = useState(() => value.replace(/\d+/g, "0"));
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
  'New Inquiry': 'border-[#888] text-[#555]',
  'Awaiting Payment': 'border-[#222] bg-[#222] text-white',
  'Payment Submitted': 'border-[#555] text-[#333]',
  'Payment Rejected': 'border-[#888] text-[#888] line-through',
  Confirmed: 'border-[#222] bg-[#222] text-white',
  Cancelled: 'border-[#AAAAAA] text-[#AAAAAA]',
};

export function StatusBadge({ status }: { status: InquiryStatus | string }) {
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-1 border whitespace-nowrap inline-block ${
        STATUS_STYLES[status] ?? 'border-[#888] text-[#555]'
      }`}
    >
      {status}
    </span>
  );
}

export function StatusPill({ status }: { status: EntityStatus }) {
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-1 border whitespace-nowrap inline-block ${
        status === 'Active'
          ? 'border-[#222] bg-[#222] text-white'
          : 'border-[#AAAAAA] text-[#AAAAAA]'
      }`}
    >
      {status}
    </span>
  );
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-20 text-sm text-[#888]">
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
      ? 'border-[#c33] text-[#a22] bg-[#fdf2f2]'
      : kind === 'success'
        ? 'border-[#2a2] text-[#175] bg-[#f2fbf5]'
        : 'border-[#D1D1D1] text-[#555] bg-[#F7F7F7]';
  return (
    <div className={`border px-4 py-2 text-xs ${styles}`}>{children}</div>
  );
}
