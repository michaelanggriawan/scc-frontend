"use client";

import { useEffect, useRef, useState } from "react";
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
  // "relative" anchors the nav's absolute positioning to this calendar's own
  // box — without it, the nearest positioned ancestor is the Reveal wrapper
  // around the whole form section (it applies a CSS transform for its
  // scroll-reveal animation, which also creates a containing block), so the
  // prev/next-month buttons would float to that section's far corners
  // instead of sitting next to "August 2026".
  root: "relative",
  months: "flex flex-col",
  month: "flex flex-col gap-3",
  month_caption: "flex items-center justify-center h-8 relative pointer-events-none",
  caption_label: "text-sm font-semibold text-ink",
  nav: "flex items-center justify-between absolute inset-x-0 top-0 h-8 z-10",
  button_previous:
    "w-7 h-7 flex items-center justify-center cursor-pointer text-ink/50 hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
  button_next:
    "w-7 h-7 flex items-center justify-center cursor-pointer text-ink/50 hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
  // Browsers apply a default 2px border-spacing to <table> that isn't
  // cleared by border-collapse once the rows/cells are flex containers
  // (rather than table-row/table-cell) — left in, it inflates each of the 7
  // day columns by a few px and pushes the last column outside this 272px
  // calendar. w-full + flex-1 columns (below) make the grid fill exactly
  // its container regardless.
  month_grid: "border-collapse [border-spacing:0] w-full",
  weekdays: "flex",
  weekday: "flex-1 h-8 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-ink/40",
  week: "flex",
  day: "flex-1 h-9 flex items-center justify-center p-0",
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

// react-day-picker's default DayButton can drop DOM focus on re-render
// (e.g. after month navigation); re-applying it here keeps arrow-key
// navigation working.
function FocusedDayButton({ day, modifiers, children, ...rest }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return (
    <button ref={ref} {...rest}>
      {children}
    </button>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fromDateStr(s: string): Date {
  return new Date(`${s}T00:00:00`);
}
function addDays(s: string, n: number): string {
  const d = fromDateStr(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}
function todayStr(): string {
  return toDateStr(new Date());
}

function monthBounds(month: Date): { from: string; to: string } {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return { from: toDateStr(first), to: toDateStr(last) };
}

const SLOT_STEP_MIN = 60;
const DAY_START_MIN = 7 * 60; // 07:00
const DAY_END_MIN = 24 * 60; // midnight
const ROW_HEIGHT = 48;
const VISIBLE_DAYS = 6;
const COL_WIDTH = 108;

function buildSlotStarts(): number[] {
  const slots: number[] = [];
  for (let m = DAY_START_MIN; m < DAY_END_MIN; m += SLOT_STEP_MIN) slots.push(m);
  return slots;
}
const SLOT_STARTS = buildSlotStarts();

// Combined calendar + multi-day hourly grid, styled after a Calendly/Google-
// style appointment scheduler: a mini month calendar on the left for jumping
// to an arbitrary date, and a horizontally-paged strip of day columns on the
// right so several days' worth of availability are visible — and directly
// comparable hour-by-hour — at once. Booked hours render as a plain dash
// instead of a clickable slot. A plain click on an open slot sets just the
// start time (duration untouched); pressing, dragging down within a column,
// and releasing sets both the start time and the duration spanned.
export function SchedulePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  durationHours,
  onDurationChange,
  min,
  roomId,
  dateError,
  timeError,
  onBookedRangesChange,
}: {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  durationHours: number;
  onDurationChange: (hours: string) => void;
  min: string; // "YYYY-MM-DD"
  roomId: string;
  dateError?: string;
  timeError?: string;
  onBookedRangesChange?: (ranges: BookedRange[]) => void;
}) {
  const minDate = fromDateStr(min);
  const selected = date ? fromDateStr(date) : undefined;
  const [calendarMonth, setCalendarMonth] = useState<Date>(selected ?? minDate);
  const [summary, setSummary] = useState<AvailabilitySummary | null>(null);
  const [windowStart, setWindowStart] = useState<string>(
    date && date >= min ? date : min,
  );
  const [rangesCache, setRangesCache] = useState<Record<string, BookedRange[]>>({});
  const [loadingDates, setLoadingDates] = useState<Record<string, boolean>>({});
  const [dragState, setDragState] = useState<{ date: string; start: number; end: number } | null>(null);

  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragStartRef = useRef<number | null>(null);
  const dragRangeRef = useRef<{ start: number; end: number } | null>(null);
  const didDragRef = useRef(false);

  // Reset cached availability when the room changes — a different room's
  // bookings have nothing to do with the previous one's.
  useEffect(() => {
    setRangesCache({});
  }, [roomId]);

  // Keep the visible window containing the selected date (e.g. after a
  // restored draft sets a date far outside the current window).
  useEffect(() => {
    if (!date) return;
    if (date < windowStart || date >= addDays(windowStart, VISIBLE_DAYS)) {
      setWindowStart(date < min ? min : date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    const { from, to } = monthBounds(calendarMonth);
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
  }, [roomId, calendarMonth]);

  const visibleDates = Array.from({ length: VISIBLE_DAYS }, (_, i) => addDays(windowStart, i));

  // Fetch (and cache) booked ranges for every day column currently on screen.
  useEffect(() => {
    if (!roomId) return;
    const missing = visibleDates.filter((d) => !(d in rangesCache));
    if (missing.length === 0) return;
    let cancelled = false;
    missing.forEach((d) => {
      setLoadingDates((s) => ({ ...s, [d]: true }));
      api
        .get<{ bookedRanges: BookedRange[] }>(
          `/public/inquiries/availability?roomId=${encodeURIComponent(roomId)}&date=${encodeURIComponent(d)}`,
        )
        .then((res) => {
          if (cancelled) return;
          setRangesCache((c) => ({ ...c, [d]: res.bookedRanges }));
        })
        .catch(() => {
          if (cancelled) return;
          setRangesCache((c) => ({ ...c, [d]: [] }));
        })
        .finally(() => {
          if (cancelled) return;
          setLoadingDates((s) => {
            const next = { ...s };
            delete next[d];
            return next;
          });
        });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, windowStart]);

  // The selected date might be outside the visible window (e.g. a restored
  // draft, before the window-sync effect above catches up) — fetch it too so
  // overlap validation always has real data to work with.
  useEffect(() => {
    if (!roomId || !date || date in rangesCache) return;
    let cancelled = false;
    api
      .get<{ bookedRanges: BookedRange[] }>(
        `/public/inquiries/availability?roomId=${encodeURIComponent(roomId)}&date=${encodeURIComponent(date)}`,
      )
      .then((res) => {
        if (!cancelled) setRangesCache((c) => ({ ...c, [date]: res.bookedRanges }));
      })
      .catch(() => {
        if (!cancelled) setRangesCache((c) => ({ ...c, [date]: [] }));
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, date, rangesCache]);

  useEffect(() => {
    onBookedRangesChange?.(date ? rangesCache[date] ?? [] : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, date ? rangesCache[date] : undefined]);

  const fullDates = Object.entries(summary?.dates ?? {})
    .filter(([, status]) => status === "full")
    .map(([d]) => fromDateStr(d));

  function rangesFor(d: string): BookedRange[] {
    return rangesCache[d] ?? [];
  }
  function isSlotBooked(d: string, m: number): boolean {
    return rangesFor(d).some((r) => {
      const s = parseTimeToMinutes(r.start);
      const e = parseTimeToMinutes(r.end);
      return s != null && e != null && m >= s && m < e;
    });
  }

  function goToday() {
    const t = todayStr();
    const target = t < min ? min : t;
    setCalendarMonth(fromDateStr(target));
    setWindowStart(target);
    onDateChange(target);
  }

  function handleSlotMouseDown(colDate: string, startMin: number) {
    didDragRef.current = false;
    dragStartRef.current = startMin;
    dragRangeRef.current = { start: startMin, end: startMin + SLOT_STEP_MIN };
    setDragState({ date: colDate, ...dragRangeRef.current });

    function onMove(ev: MouseEvent) {
      const ref = columnRefs.current[colDate];
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      const idx = Math.floor((ev.clientY - rect.top) / ROW_HEIGHT);
      const clamped = Math.min(Math.max(idx, 0), SLOT_STARTS.length - 1);
      const cur = SLOT_STARTS[clamped];
      if (cur !== dragStartRef.current) didDragRef.current = true;
      // The hovered row is inclusive — its far edge is its start + 1hr, not
      // its start, otherwise the row the cursor is actually over never
      // makes it into the selection.
      const start = Math.min(dragStartRef.current!, cur);
      const end = Math.max(dragStartRef.current!, cur) + SLOT_STEP_MIN;
      dragRangeRef.current = { start, end };
      setDragState({ date: colDate, start, end });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (didDragRef.current && dragRangeRef.current) {
        const { start, end } = dragRangeRef.current;
        const hours = Math.max(1, Math.round((end - start) / 60));
        onDateChange(colDate);
        onTimeChange(minutesToTime(start));
        onDurationChange(String(hours));
      }
      setDragState(null);
      dragStartRef.current = null;
      dragRangeRef.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const overlap = time && date ? overlapsBookedRange(time, durationHours, rangesFor(date)) : null;
  const canGoPrev = addDays(windowStart, -1) >= min;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[13px] text-ink/40">
        Click an open hour, or press and drag down to set the start time and duration together — times shown in (GMT+07:00) Western Indonesia Time.
      </p>
      <div
        className={`border bg-[var(--surface)] ${
          dateError || timeError ? "border-danger" : "border-[var(--surface-border)]"
        }`}
      >
        <div className="flex flex-col md:flex-row">
          <div className="md:w-[272px] flex-shrink-0 overflow-hidden border-b md:border-b-0 md:border-r border-[var(--surface-border)] p-3">
            <DayPicker
              mode="single"
              selected={selected}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              disabled={[{ before: minDate }, ...fullDates]}
              onSelect={(d) => {
                if (!d) return;
                const s = toDateStr(d);
                onDateChange(s);
                setWindowStart(s < min ? min : s);
              }}
              classNames={dayPickerClassNames}
              components={{ Chevron: DayPickerChevron, DayButton: FocusedDayButton }}
            />
            <div className="flex justify-end px-1 pb-1">
              <button
                type="button"
                onClick={goToday}
                className="text-xs font-semibold text-gold-dim hover:text-mahogany transition-colors duration-150 cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0 flex items-stretch">
            <button
              type="button"
              onClick={() => canGoPrev && setWindowStart((w) => addDays(w, -1))}
              disabled={!canGoPrev}
              aria-label="Show earlier days"
              className="flex-shrink-0 w-7 flex items-center justify-center text-ink/40 hover:text-ink transition-colors duration-150 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
            >
              <Icon name="arrowLeft" className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0 overflow-auto" style={{ maxHeight: 520 }}>
              <div className="flex" style={{ minWidth: VISIBLE_DAYS * COL_WIDTH }}>
                {visibleDates.map((d) => {
                  const dObj = fromDateStr(d);
                  const isSelectedCol = d === date;
                  const isToday = d === todayStr();
                  const selStart = isSelectedCol && time ? parseTimeToMinutes(time) : null;
                  const selEnd =
                    selStart != null && durationHours > 0 ? selStart + durationHours * 60 : null;
                  const colLoading = !!loadingDates[d];

                  return (
                    <div
                      key={d}
                      className="flex flex-col flex-shrink-0 border-r border-[var(--surface-border)] last:border-r-0"
                      style={{ width: COL_WIDTH }}
                    >
                      <div className="sticky top-0 z-10 flex flex-col items-center justify-center gap-1 py-2.5 bg-[var(--surface)] border-b border-[var(--surface-border)]">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">
                          {dObj.toLocaleDateString("en-GB", { weekday: "short" })}
                        </span>
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                            isSelectedCol
                              ? "bg-gold text-mahogany-2 font-semibold"
                              : isToday
                                ? "border border-gold-dim text-mahogany font-semibold"
                                : "text-ink/70"
                          }`}
                        >
                          {dObj.getDate()}
                        </span>
                      </div>

                      <div
                        ref={(el) => {
                          columnRefs.current[d] = el;
                        }}
                        className={`flex flex-col select-none ${colLoading ? "opacity-40 pointer-events-none" : ""}`}
                      >
                        {SLOT_STARTS.map((m) => {
                          const booked = isSlotBooked(d, m);
                          const inDrag =
                            dragState != null && dragState.date === d && m >= dragState.start && m < dragState.end;
                          const inSelection =
                            !dragState && selStart != null && selEnd != null && m >= selStart && m < selEnd;

                          return (
                            <div
                              key={m}
                              style={{ height: ROW_HEIGHT }}
                              className="flex items-center justify-center border-b border-[var(--surface-border)] last:border-b-0"
                            >
                              {booked ? (
                                <span className="text-ink/25 text-sm">—</span>
                              ) : (
                                <button
                                  type="button"
                                  onMouseDown={() => handleSlotMouseDown(d, m)}
                                  onClick={() => {
                                    if (didDragRef.current) return;
                                    onDateChange(d);
                                    onTimeChange(minutesToTime(m));
                                    onDurationChange("1");
                                  }}
                                  className={`w-[88%] h-9 rounded-full border text-xs font-medium tabular-nums cursor-pointer transition-colors duration-100 flex items-center justify-center ${
                                    inDrag
                                      ? "border-2 border-dashed border-gold bg-gold/30 text-mahogany-2 font-semibold"
                                      : inSelection
                                        ? `border-gold bg-gold/40 text-mahogany-2 font-semibold ${
                                            overlap && isSelectedCol ? "ring-1 ring-danger" : ""
                                          }`
                                        : "border-[var(--surface-border-strong)] text-mahogany hover:border-gold-dim hover:bg-gold/10"
                                  }`}
                                >
                                  {minutesToTime(m)}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setWindowStart((w) => addDays(w, 1))}
              aria-label="Show later days"
              className="flex-shrink-0 w-7 flex items-center justify-center text-ink/40 hover:text-ink transition-colors duration-150 cursor-pointer"
            >
              <Icon name="arrowRight" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {overlap ? (
        <p className="text-xs text-danger">
          This overlaps an existing booking from {overlap.start} to {overlap.end}. Please choose a
          different time or duration.
        </p>
      ) : (
        <>
          {dateError && <p className="text-xs text-danger">{dateError}</p>}
          {timeError && <p className="text-xs text-danger">{timeError}</p>}
        </>
      )}
    </div>
  );
}
