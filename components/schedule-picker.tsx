"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { Icon } from "@/components/ui";
import {
  minutesToTime,
  overlapsBookedRange,
  parseTimeToMinutes,
} from "@/lib/datetime";
import type { BookedRange } from "@/lib/types";

const dayPickerClassNames = {
  root: "p-3",
  months: "flex flex-col",
  month: "flex flex-col gap-3",
  month_caption: "flex items-center justify-center h-8 relative pointer-events-none",
  caption_label: "text-sm font-semibold text-ink",
  nav: "flex items-center justify-between absolute inset-x-0 top-0 h-8 z-10",
  button_previous:
    "w-7 h-7 flex items-center justify-center cursor-pointer text-ink/50 hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
  button_next:
    "w-7 h-7 flex items-center justify-center cursor-pointer text-ink/50 hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
  month_grid: "border-collapse",
  weekdays: "flex",
  weekday: "w-9 h-8 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-ink/40",
  week: "flex",
  day: "w-9 h-9 flex items-center justify-center p-0",
  day_button:
    "w-8 h-8 flex items-center justify-center text-sm text-ink/80 cursor-pointer transition-colors duration-150 hover:bg-gold/15 disabled:cursor-not-allowed disabled:text-ink/25 disabled:hover:bg-transparent",
  today: "font-semibold text-mahogany",
  selected: "[&>button]:bg-gold [&>button]:text-mahogany-2 [&>button]:font-semibold [&>button]:hover:bg-gold",
  outside: "text-ink/25",
};

function DayPickerChevron({
  orientation,
}: {
  orientation?: "up" | "down" | "left" | "right";
}) {
  return (
    <Icon
      name={orientation === "right" ? "arrowRight" : "arrowLeft"}
      className="w-3.5 h-3.5"
    />
  );
}

export function DatePicker({
  label,
  value,
  onChange,
  min,
  error,
}: {
  label: string;
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  min: string; // "YYYY-MM-DD"
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Popover is portaled to <body> and positioned in viewport coordinates so
  // it can never get trapped behind a later sibling's stacking context (see
  // .reveal's `transform`, which creates one per form section). Since it's
  // `position: fixed`, it won't scroll into view on its own if it opens too
  // close to a viewport edge — flip/clamp against estimated panel size.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const PANEL_HEIGHT_ESTIMATE = 340;
    const PANEL_WIDTH_ESTIMATE = 300;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward =
      spaceBelow < PANEL_HEIGHT_ESTIMATE + 16 && rect.top > PANEL_HEIGHT_ESTIMATE + 16;
    const top = openUpward ? rect.top - PANEL_HEIGHT_ESTIMATE - 8 : rect.bottom + 8;
    const left = Math.min(rect.left, window.innerWidth - PANEL_WIDTH_ESTIMATE - 8);
    setPanelPos({ top: Math.max(top, 8), left: Math.max(left, 8) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const minDate = new Date(`${min}T00:00:00`);

  const formatted = selected
    ? selected.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2 border bg-[var(--field-bg)] h-11 px-3.5 text-sm text-left cursor-pointer outline-none transition-colors duration-150 ${
          error
            ? "border-danger"
            : "border-[var(--field-border)] hover:border-gold-dim"
        } ${formatted ? "text-[var(--text-primary)]" : "text-[var(--field-placeholder)]"}`}
      >
        {formatted || "Select a date"}
        <Icon name="calendar" className="w-4 h-4 text-gold-dim flex-shrink-0" />
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: panelPos.top, left: panelPos.left }}
            className="fixed z-50 border border-[var(--surface-border)] bg-[var(--surface)] shadow-lg"
          >
            <span className="absolute top-0 left-6 right-6 h-px bg-[linear-gradient(90deg,transparent,var(--color-gold),transparent)]" />
            <DayPicker
              mode="single"
              selected={selected}
              defaultMonth={selected ?? minDate}
              disabled={{ before: minDate }}
              onSelect={(d) => {
                if (!d) return;
                const pad = (n: number) => String(n).padStart(2, "0");
                onChange(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
                setOpen(false);
              }}
              classNames={dayPickerClassNames}
              components={{ Chevron: DayPickerChevron }}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

const SLOT_STEP_MIN = 30;
const DAY_START_MIN = 7 * 60; // 07:00
const DAY_END_MIN = 24 * 60; // midnight
const PX_PER_HOUR = 40;

function minutesToY(min: number): number {
  return ((min - DAY_START_MIN) / 60) * PX_PER_HOUR;
}

const HOUR_LABELS = (() => {
  const labels: number[] = [];
  for (let m = DAY_START_MIN; m < DAY_END_MIN; m += 60) labels.push(m);
  return labels;
})();

function buildSlotStarts(): number[] {
  const slots: number[] = [];
  for (let m = DAY_START_MIN; m < DAY_END_MIN; m += SLOT_STEP_MIN) slots.push(m);
  return slots;
}
const SLOT_STARTS = buildSlotStarts();

const TIMELINE_HEIGHT = minutesToY(DAY_END_MIN);
const GUTTER_WIDTH = 52;

// Vertical day timeline (like Google Calendar's week view): booked ranges
// render as solid blocks, the current start-time + duration selection
// renders as its own translucent block on top, so an overlap is visible at
// a glance instead of only surfacing as a validation error after the fact.
export function TimeSlotPicker({
  label,
  value,
  onChange,
  bookedRanges,
  loading,
  durationHours,
  error,
}: {
  label: string;
  value: string; // "HH:MM"
  onChange: (time: string) => void;
  bookedRanges: BookedRange[];
  loading?: boolean;
  durationHours: number;
  error?: string;
}) {
  const overlap = value ? overlapsBookedRange(value, durationHours, bookedRanges) : null;
  const selStart = value ? parseTimeToMinutes(value) : null;
  const selEnd = selStart != null && durationHours > 0 ? selStart + durationHours * 60 : null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
        {label}
      </span>
      <div
        className={`relative border bg-[var(--field-bg)] max-h-[420px] overflow-y-auto ${
          error ? "border-danger" : "border-[var(--field-border)]"
        } ${loading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="relative flex" style={{ height: TIMELINE_HEIGHT }}>
          {/* Hour gutter */}
          <div className="flex-shrink-0 relative" style={{ width: GUTTER_WIDTH }}>
            {HOUR_LABELS.map((m) => (
              <span
                key={m}
                className="absolute right-2 -translate-y-1/2 text-[10px] text-ink/40 tabular-nums"
                style={{ top: minutesToY(m) }}
              >
                {minutesToTime(m)}
              </span>
            ))}
          </div>

          {/* Timeline */}
          <div className="relative flex-1 border-l border-[var(--surface-border)]">
            {HOUR_LABELS.map((m) => (
              <div
                key={m}
                className="absolute inset-x-0 border-t border-[var(--surface-border)]"
                style={{ top: minutesToY(m) }}
              />
            ))}

            {bookedRanges.map((r, i) => {
              const s = parseTimeToMinutes(r.start);
              const e = parseTimeToMinutes(r.end);
              if (s == null || e == null) return null;
              const top = minutesToY(Math.max(s, DAY_START_MIN));
              const height = Math.max(minutesToY(Math.min(e, DAY_END_MIN)) - top, 4);
              return (
                <div
                  key={i}
                  className="absolute inset-x-0.5 rounded-sm bg-danger/20 border border-danger/40 px-1.5 py-0.5 overflow-hidden"
                  style={{ top, height }}
                >
                  <span className="text-[10px] font-medium text-danger/90 leading-tight">
                    Booked {r.start}–{r.end}
                  </span>
                </div>
              );
            })}

            {SLOT_STARTS.map((m) => {
              const booked = bookedRanges.some((r) => {
                const s = parseTimeToMinutes(r.start);
                const e = parseTimeToMinutes(r.end);
                return s != null && e != null && m >= s && m < e;
              });
              return (
                <button
                  key={m}
                  type="button"
                  disabled={booked}
                  title={booked ? "Already booked" : minutesToTime(m)}
                  onClick={() => onChange(minutesToTime(m))}
                  className={`absolute inset-x-0 cursor-pointer transition-colors duration-100 ${
                    booked ? "cursor-not-allowed" : "hover:bg-gold/10"
                  }`}
                  style={{ top: minutesToY(m), height: PX_PER_HOUR / 2 }}
                />
              );
            })}

            {selStart != null && selEnd != null && (
              <div
                className={`absolute inset-x-0.5 rounded-sm border-2 pointer-events-none ${
                  overlap ? "bg-gold/40 border-danger" : "bg-gold/40 border-gold"
                }`}
                style={{
                  top: minutesToY(selStart),
                  height: Math.max(minutesToY(selEnd) - minutesToY(selStart), 4),
                }}
              >
                <span className="text-[10px] font-semibold text-mahogany-2 px-1.5 py-0.5 block">
                  {value}–{minutesToTime(selEnd)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {overlap && (
        <p className="text-xs text-danger">
          This overlaps an existing booking from {overlap.start} to {overlap.end}.
          Please choose a different time or duration.
        </p>
      )}
      {error && !overlap && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
