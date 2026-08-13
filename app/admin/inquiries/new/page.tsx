"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { SchedulePicker } from "@/components/schedule-picker";
import {
  Alert,
  Btn,
  OutlineBtn,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { overlapsBookedRange } from "@/lib/datetime";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import type { AddOn, BookedRange, Room } from "@/lib/types";

// Admin bookings aren't subject to the customer lead-time rule — today, not
// today+7 — unlike lib/validation.ts's minBookingDate().
function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
const MIN_DATE = todayDate();

type FieldErrors = Partial<
  Record<
    "category" | "room" | "date" | "time" | "duration" | "name" | "email" | "phone",
    string
  >
>;

export default function NewAdminInquiryPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [category, setCategory] = useState("");
  const [roomId, setRoomId] = useState("");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Room[]>("/admin/rooms"),
      api.get<AddOn[]>("/admin/addons"),
      api.get<string[]>("/public/event-categories"),
    ])
      .then(([r, a, c]) => {
        setRooms(r);
        setAddons(a);
        setCategories(c);
      })
      .finally(() => setLoaded(true));
  }, []);

  function toggleAddon(id: string) {
    setAddonIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  // Mirrors app/booking/page.tsx's getFieldErrors(), except the date floor
  // is today rather than today+7.
  function getFieldErrors(): FieldErrors {
    const errs: FieldErrors = {};
    if (!category) errs.category = "Please select an event category.";
    if (!roomId) errs.room = "Please select a room.";
    if (!date) errs.date = "Please choose an event date.";
    else if (date < MIN_DATE) errs.date = "Event date can't be in the past.";
    if (!time) errs.time = "Please choose a start time.";
    const durationNum = Number(duration);
    if (!duration.trim() || !Number.isInteger(durationNum) || durationNum < 1) {
      errs.duration = "Duration must be a whole number of at least 1.";
    } else if (time && overlapsBookedRange(time, durationNum, bookedRanges)) {
      errs.time =
        "This time overlaps an existing booking. Please choose a different time or duration.";
    }
    if (!name.trim()) errs.name = "Please provide the customer's full name.";
    if (!email.trim() || !isValidEmail(email)) {
      errs.email = "Please provide a valid email address.";
    }
    if (!phone.trim() || !isValidPhone(phone)) {
      errs.phone = "Please provide a valid phone number.";
    }
    return errs;
  }
  const fieldErrors = getFieldErrors();
  const showErrors = (field: keyof FieldErrors) =>
    submitAttempted ? fieldErrors[field] : undefined;

  async function submit() {
    setError("");
    setSubmitAttempted(true);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.post("/admin/inquiries", {
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        roomId: roomId || null,
        addonIds,
        date,
        time,
        duration,
        category,
        notes,
      });
      router.push("/admin/inquiries");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const activeRooms = rooms.filter((r) => r.status === "Active");
  const activeAddons = addons.filter((a) => a.status === "Active");

  return (
    <>
      <AdminHeader title="Add Booking">
        <OutlineBtn sm onClick={() => router.push("/admin/inquiries")}>
          Cancel
        </OutlineBtn>
      </AdminHeader>
      <div className="px-4 md:px-8 py-6 md:py-8">
        {!loaded ? (
          <Spinner />
        ) : (
          <div className="max-w-xl bg-white border border-[var(--surface-border)] p-7 flex flex-col gap-5">
            <TextField
              label="Customer name"
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={showErrors("name")}
            />
            <TextField
              label="Customer email"
              type="email"
              placeholder="e.g. jane@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={showErrors("email")}
            />
            <TextField
              label="Customer phone"
              type="tel"
              placeholder="e.g. 0812 3456 7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={showErrors("phone")}
            />

            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              error={showErrors("category")}
            >
              <option value="">— select —</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>

            <Select
              label="Room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              error={showErrors("room")}
            >
              <option value="">— select —</option>
              {activeRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
                Add-ons
              </span>
              <div className="flex flex-col gap-2 border border-[var(--field-border)] p-3">
                {activeAddons.length === 0 && (
                  <span className="text-xs text-[var(--text-muted)]">None</span>
                )}
                {activeAddons.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addonIds.includes(a.id)}
                      onChange={() => toggleAddon(a.id)}
                      className="gold-checkbox"
                    />
                    <span className="text-xs text-ink">{a.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <SchedulePicker
              date={date}
              time={time}
              onDateChange={setDate}
              onTimeChange={setTime}
              durationHours={Number(duration) || 0}
              onDurationChange={setDuration}
              min={MIN_DATE}
              roomId={roomId}
              dateError={showErrors("date")}
              timeError={showErrors("time")}
              onBookedRangesChange={setBookedRanges}
            />

            <TextArea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this booking…"
            />

            {error && <Alert>{error}</Alert>}

            <div className="flex gap-3">
              <Btn disabled={submitting} onClick={submit}>
                {submitting ? "Creating…" : "Create booking"}
              </Btn>
              <OutlineBtn onClick={() => router.push("/admin/inquiries")}>
                Cancel
              </OutlineBtn>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
