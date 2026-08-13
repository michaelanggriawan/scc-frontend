"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import type { DayButtonProps } from "react-day-picker";
import { Icon } from "@/components/ui";
import { api } from "@/lib/api";
import {
  minutesToTime,
  overlapsBookedRange,
  parseTimeToMinutes,
} from "@/lib/datetime";
import type { AvailabilitySummary, BookedRange } from "@/lib/types";

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
    "relative w-8 h-8 flex items-center justify-center text-sm text-ink/80 cursor-pointer transition-colors duration-150 hover:bg-gold/15 disabled:cursor-not-allowed disabled:text-ink/25 disabled:hover:bg-transparent",
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

// Adds a small dot under days flagged with the "partial" modifier (booked,
// but at least one bookable hour remains) — fully-booked days are simply
// disabled instead, so they never reach this branch.
function DayButtonWithDot({ day, modifiers, children, ...rest }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return (
    <button ref={ref} {...rest}>
      {children}
      {modifiers.partial && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-dim" />
      )}
    </button>
  );
}

function monthBounds(month: Date): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { from: fmt(first), to: fmt(last) };
}

export function DatePicker({
  label,
  value,
  onChange,
  min,
  roomId,
  error,
}: {
  label: string;
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  min: string; // "YYYY-MM-DD"
  roomId: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const minDate = new Date(`${min}T00:00:00`);
  const [month, setMonth] = useState<Date>(selected ?? minDate);
  const [summary, setSummary] = useState<AvailabilitySummary | null>(null);

  // Popover is portaled to <body> and positioned in viewport coordinates so
  // it can never get trapped behind a later sibling's stacking context (see
  // .reveal's `transform`, which creates one per form section). Since it's
  // `position: fixed`, it won't scroll into view on its own if it opens too
  // close to a viewport edge — flip/clamp against estimated panel size.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const PANEL_HEIGHT_ESTIMATE = 380;
    const PANEL_WIDTH_ESTIMATE = 300;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward =
      spaceBelow < PANEL_HEIGHT_ESTIMATE + 16 && rect.top > PANEL_HEIGHT_ESTIMATE + 16;
    const top = openUpward ? rect.top - PANEL_HEIGHT_ESTIMATE - 8 : rect.bottom + 8;
    const left = Math.min(rect.left, window.innerWidth - PANEL_WIDTH_ESTIMATE - 8);
    setPanelPos({ top: Math.max(top, 8), left: Math.max(left, 8) });
    setMonth(selected ?? minDate);
    // Only re-sync when the popover freshly opens — otherwise this would
    // fight the user's own prev/next-month navigation while it's open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !roomId) return;
    let cancelled = false;
    const { from, to } = monthBounds(month);
    api
      .get<AvailabilitySummary>(
        `/public/inquiries/availability-summary?roomId=${encodeURIComponent(roomId)}&from=${from}&to=${to}`,
      )
      .then((res) => {
        if (!cancelled) setSummary(res);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, roomId, month]);

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

  const formatted = selected
    ? selected.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const fullDates = Object.entries(summary?.dates ?? {})
    .filter(([, status]) => status === "full")
    .map(([d]) => new Date(`${d}T00:00:00`));
  const partialDates = Object.entries(summary?.dates ?? {})
    .filter(([, status]) => status === "partial")
    .map(([d]) => new Date(`${d}T00:00:00`));

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
              month={month}
              onMonthChange={setMonth}
              disabled={[{ before: minDate }, ...fullDates]}
              modifiers={{ partial: partialDates }}
              onSelect={(d) => {
                if (!d) return;
                const pad = (n: number) => String(n).padStart(2, "0");
                onChange(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
                setOpen(false);
              }}
              classNames={dayPickerClassNames}
              components={{ Chevron: DayPickerChevron, DayButton: DayButtonWithDot }}
            />
            <div className="flex items-center justify-between gap-3 border-t border-[var(--surface-border)] px-4 py-2">
              <p className="flex items-center gap-1.5 text-[10px] text-ink/40">
                <span className="w-1 h-1 rounded-full bg-gold-dim flex-shrink-0" />
                Partially booked
              </p>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setMonth(today);
                  if (today >= minDate) {
                    const pad = (n: number) => String(n).padStart(2, "0");
                    onChange(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
                  }
                }}
                className="text-xs font-semibold text-gold-dim hover:text-mahogany transition-colors duration-150 cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

const SLOT_STEP_MIN = 60;
const DAY_START_MIN = 7 * 60; // 07:00
const DAY_END_MIN = 24 * 60; // midnight
const ROW_HEIGHT = 44;

function buildSlotStarts(): number[] {
  const slots: number[] = [];
  for (let m = DAY_START_MIN; m < DAY_END_MIN; m += SLOT_STEP_MIN) slots.push(m);
  return slots;
}
const SLOT_STARTS = buildSlotStarts();

// Vertical list of hourly start-time rows: booked hours render disabled and
// struck through, the current start-time + duration selection highlights
// its rows directly, so an overlap is visible at a glance instead of only
// surfacing as a validation error after the fact. A plain click sets just
// the start time (duration untouched); pressing, dragging down, and
// releasing sets both the start time and the duration spanned by the drag.
export function TimeSlotPicker({
  label,
  value,
  onChange,
  onDurationChange,
  bookedRanges,
  loading,
  durationHours,
  error,
}: {
  label: string;
  value: string; // "HH:MM"
  onChange: (time: string) => void;
  onDurationChange: (hours: string) => void;
  bookedRanges: BookedRange[];
  loading?: boolean;
  durationHours: number;
  error?: string;
}) {
  const overlap = value ? overlapsBookedRange(value, durationHours, bookedRanges) : null;
  const selStart = value ? parseTimeToMinutes(value) : null;
  const selEnd = selStart != null && durationHours > 0 ? selStart + durationHours * 60 : null;

  const listRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<number | null>(null);
  const dragRangeRef = useRef<{ start: number; end: number } | null>(null);
  const didDragRef = useRef(false);
  const [dragPreview, setDragPreview] = useState<{ start: number; end: number } | null>(null);

  function yToSlot(clientY: number): number {
    const rect = listRef.current!.getBoundingClientRect();
    const idx = Math.floor((clientY - rect.top) / ROW_HEIGHT);
    const clamped = Math.min(Math.max(idx, 0), SLOT_STARTS.length - 1);
    return SLOT_STARTS[clamped];
  }

  function handleSlotMouseDown(startMin: number, booked: boolean) {
    if (booked) return;
    didDragRef.current = false;
    dragStartRef.current = startMin;
    dragRangeRef.current = { start: startMin, end: startMin + SLOT_STEP_MIN };
    setDragPreview(dragRangeRef.current);

    function onMove(ev: MouseEvent) {
      const cur = yToSlot(ev.clientY);
      if (cur !== dragStartRef.current) didDragRef.current = true;
      const s = Math.min(dragStartRef.current!, cur);
      const e = Math.max(dragStartRef.current!, cur);
      dragRangeRef.current = { start: s, end: e === s ? e + SLOT_STEP_MIN : e };
      setDragPreview(dragRangeRef.current);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (didDragRef.current && dragRangeRef.current) {
        const { start, end } = dragRangeRef.current;
        const hours = Math.max(1, Math.round((end - start) / 60));
        onChange(minutesToTime(start));
        onDurationChange(String(hours));
      }
      setDragPreview(null);
      dragStartRef.current = null;
      dragRangeRef.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
        {label}
      </span>
      <p className="text-[11px] text-ink/40">
        Click an hour, or press and drag down to set the start time and duration together.
      </p>
      <div
        ref={listRef}
        className={`relative flex flex-col border bg-[var(--field-bg)] max-h-[420px] overflow-y-auto select-none ${
          error ? "border-danger" : "border-[var(--field-border)]"
        } ${loading ? "opacity-50 pointer-events-none" : ""}`}
      >
        {SLOT_STARTS.map((m) => {
          const booked = bookedRanges.some((r) => {
            const s = parseTimeToMinutes(r.start);
            const e = parseTimeToMinutes(r.end);
            return s != null && e != null && m >= s && m < e;
          });
          const inSelection =
            !dragPreview && selStart != null && selEnd != null && m >= selStart && m < selEnd;
          const inDrag = dragPreview != null && m >= dragPreview.start && m < dragPreview.end;
          return (
            <button
              key={m}
              type="button"
              disabled={booked}
              onMouseDown={() => handleSlotMouseDown(m, booked)}
              onClick={() => {
                if (didDragRef.current) return;
                onChange(minutesToTime(m));
              }}
              style={{ height: ROW_HEIGHT }}
              className={`flex-shrink-0 flex items-center justify-between px-3.5 border-b border-[var(--surface-border)] last:border-b-0 text-sm cursor-pointer transition-colors duration-100 ${
                booked
                  ? "text-ink/30 line-through cursor-not-allowed bg-transparent"
                  : inDrag
                    ? "bg-gold/30 border-2 border-dashed border-gold text-mahogany-2 font-semibold"
                    : inSelection
                      ? `font-semibold text-mahogany-2 ${overlap ? "bg-gold/40 border border-danger" : "bg-gold/40"}`
                      : "text-ink/75 hover:bg-gold/10"
              }`}
            >
              <span className="tabular-nums">{minutesToTime(m)}</span>
              {booked && <span className="text-[11px] font-medium text-ink/35">Booked</span>}
            </button>
          );
        })}
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
