"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { Icon, Spinner } from "@/components/ui";
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
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
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
    <div className="relative flex flex-col gap-1.5" ref={wrapRef}>
      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
        {label}
      </span>
      <button
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

      {open && (
        <div className="absolute top-full left-0 mt-2 z-30 border border-[var(--surface-border)] bg-[var(--surface)] shadow-lg">
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
        </div>
      )}
    </div>
  );
}

const SLOT_STEP_MIN = 30;
const SLOT_START_MIN = 7 * 60; // 07:00
const SLOT_END_MIN = 23 * 60; // 23:00 (last selectable start)

function buildSlots(): string[] {
  const slots: string[] = [];
  for (let m = SLOT_START_MIN; m <= SLOT_END_MIN; m += SLOT_STEP_MIN) {
    slots.push(minutesToTime(m));
  }
  return slots;
}
const SLOTS = buildSlots();

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

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
        {label}
      </span>
      {loading ? (
        <div className="border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-6 flex justify-center">
          <Spinner label="Checking availability…" />
        </div>
      ) : (
        <div
          className={`border bg-[var(--field-bg)] p-3 flex flex-wrap gap-2 max-h-40 overflow-y-auto ${
            error ? "border-danger" : "border-[var(--field-border)]"
          }`}
        >
          {SLOTS.map((slot) => {
            const slotMin = parseTimeToMinutes(slot)!;
            const booked = bookedRanges.some((r) => {
              const s = parseTimeToMinutes(r.start);
              const e = parseTimeToMinutes(r.end);
              return s != null && e != null && slotMin >= s && slotMin < e;
            });
            const isSelected = value === slot;
            return (
              <button
                key={slot}
                type="button"
                disabled={booked}
                onClick={() => onChange(slot)}
                title={booked ? "Already booked" : undefined}
                className={`px-3 py-1.5 text-xs border cursor-pointer transition-colors duration-150 ${
                  booked
                    ? "border-[var(--surface-border)] text-ink/25 line-through cursor-not-allowed bg-transparent"
                    : isSelected
                      ? "border-gold bg-gold text-mahogany-2 font-semibold"
                      : "border-[var(--surface-border)] text-ink/70 hover:border-gold-dim"
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      )}
      {bookedRanges.length > 0 && !loading && (
        <p className="flex items-center gap-1.5 text-[11px] text-ink/45">
          <Icon name="info" className="w-3.5 h-3.5 text-gold-dim flex-shrink-0" />
          Already booked:{" "}
          {bookedRanges.map((r) => `${r.start}–${r.end}`).join(", ")}
        </p>
      )}
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
