// Converts an ISO datetime string to the value <input type="datetime-local">
// expects (local time, "YYYY-MM-DDTHH:mm", no seconds/zone).
export function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Converts a <input type="datetime-local"> value (local time) back to an ISO string.
export function fromDatetimeLocal(local: string): string {
  return new Date(local).toISOString();
}

// Suggested payment due date: now + 24 hours, as a datetime-local value.
export function defaultDueDateLocal(): string {
  const d = new Date();
  d.setHours(d.getHours() + 24);
  return toDatetimeLocal(d.toISOString());
}

// "HH:MM" -> minutes since midnight, or null if malformed.
export function parseTimeToMinutes(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

// minutes since midnight -> "HH:MM" (not wrapped at 24h, see backend twin).
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Rounds "HH:MM" to the nearest 30-minute slot (e.g. a restored draft's
// "12:12" -> "12:00") so it always lines up with a real clickable slot.
// Returns the input unchanged if it doesn't parse as a time.
export function snapToHalfHour(time: string): string {
  const min = parseTimeToMinutes(time);
  if (min == null) return time;
  const snapped = Math.round(min / 30) * 30;
  return minutesToTime(((snapped % 1440) + 1440) % 1440);
}

// True if [start, start+durationHours) overlaps any of the given booked ranges.
export function overlapsBookedRange(
  time: string,
  durationHours: number,
  ranges: { start: string; end: string }[],
): { start: string; end: string } | null {
  const start = parseTimeToMinutes(time);
  if (start == null || durationHours <= 0) return null;
  const end = start + durationHours * 60;
  for (const r of ranges) {
    const exStart = parseTimeToMinutes(r.start);
    const exEnd = parseTimeToMinutes(r.end);
    if (exStart == null || exEnd == null) continue;
    if (start < exEnd && exStart < end) return r;
  }
  return null;
}

// Human-readable due date/time for customer-facing display.
export function formatDueDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
