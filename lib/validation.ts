import type { ClipboardEvent, KeyboardEvent } from "react";

const ALLOWED_NUMERIC_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Escape",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

// Blocks any keystroke that isn't a digit or a navigation/editing key. Native
// type="number" inputs otherwise still let you type "e", "+", "-", "." —
// this makes whole-number-only fields truly number-only.
export function blockNonDigitKeys(e: KeyboardEvent<HTMLInputElement>) {
  if (e.metaKey || e.ctrlKey || ALLOWED_NUMERIC_KEYS.has(e.key)) return;
  if (!/^[0-9]$/.test(e.key)) e.preventDefault();
}

// Rejects pasted content that isn't purely digits, for the same fields.
export function blockNonDigitPaste(e: ClipboardEvent<HTMLInputElement>) {
  const text = e.clipboardData.getData("text");
  if (!/^[0-9]+$/.test(text)) e.preventDefault();
}

// Returns an error message if the password doesn't meet the rules, or null if it's valid.
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/\d/.test(password)) return "Password must include a number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include a symbol.";
  return null;
}

// Earliest bookable event date: today + 7 days, as YYYY-MM-DD.
export function minBookingDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

const PHONE_RE = /^[0-9+()\-\s]{6,20}$/;
export function isValidPhone(phone: string): boolean {
  return PHONE_RE.test(phone.trim());
}

export const MAX_UPLOAD_MB = 5;
export function isValidUploadSize(file: File): boolean {
  return file.size <= MAX_UPLOAD_MB * 1024 * 1024;
}
