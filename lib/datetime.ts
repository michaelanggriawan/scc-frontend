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
