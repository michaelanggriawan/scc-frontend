'use client';

import { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
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
  error,
  ...props
}: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
        {label}
      </span>
      <input
        {...props}
        className={`border bg-white h-10 px-3 text-sm text-[#333] placeholder:text-[#AAAAAA] outline-none ${
          error
            ? "border-[#c33] focus:border-[#c33]"
            : "border-[#AAAAAA] focus:border-[#222]"
        }`}
      />
      {error && <span className="text-xs text-[#c33]">{error}</span>}
    </label>
  );
}

export function TextArea({
  label,
  error,
  ...props
}: { label: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
        {label}
      </span>
      <textarea
        {...props}
        className={`border bg-white px-3 py-2 text-sm text-[#333] min-h-[100px] placeholder:text-[#AAAAAA] outline-none ${
          error
            ? "border-[#c33] focus:border-[#c33]"
            : "border-[#AAAAAA] focus:border-[#222]"
        }`}
      />
      {error && <span className="text-xs text-[#c33]">{error}</span>}
    </label>
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
