"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavBar, Footer, FloatingWA } from "@/components/site";
import {
  Alert,
  Btn,
  Icon,
  Modal,
  OutlineBtn,
  PhotoBox,
  Reveal,
  SLabel,
  Spinner,
  TextArea,
  TextField,
} from "@/components/ui";
import { SchedulePicker } from "@/components/schedule-picker";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { overlapsBookedRange, snapToHalfHour } from "@/lib/datetime";
import { isValidEmail, isValidPhone, minBookingDate } from "@/lib/validation";
import type { AddOn, BookedRange, Room } from "@/lib/types";

const MIN_DATE = minBookingDate();
const DRAFT_KEY = "scc_booking_draft";

type Draft = {
  category: string;
  roomId: string;
  addonIds: string[];
  date: string;
  time: string;
  duration: string;
  notes: string;
  name: string;
  email: string;
  phone: string;
};

function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: Draft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore storage failures (e.g. private browsing quota)
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

type FieldErrors = Partial<
  Record<
    "category" | "room" | "date" | "time" | "duration" | "name" | "email" | "phone",
    string
  >
>;

export default function BookingPage() {
  const { user } = useAuth();
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

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [successRef, setSuccessRef] = useState("");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);

  // Restore a draft saved before an unauthenticated user was sent to sign up.
  // Declared before the data-fetch effect below so it commits first and the
  // room-preselect logic there can see the restored roomId.
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setCategory(draft.category ?? "");
    setRoomId(draft.roomId ?? "");
    setAddonIds(draft.addonIds ?? []);
    setDate(draft.date ?? "");
    // Older drafts may hold an off-grid time from before the slot picker
    // (e.g. free-typed into the native input); snap it to a real slot.
    setTime(draft.time ? snapToHalfHour(draft.time) : "");
    setDuration(draft.duration ?? "");
    setNotes(draft.notes ?? "");
    setName(draft.name ?? "");
    setEmail(draft.email ?? "");
    setPhone(draft.phone ?? "");
  }, []);

  useEffect(() => {
    Promise.all([
      api.get<Room[]>("/public/rooms"),
      api.get<AddOn[]>("/public/addons"),
      api.get<string[]>("/public/event-categories"),
    ])
      .then(([r, a, c]) => {
        setRooms(r);
        setAddons(a);
        setCategories(c);
        setRoomId((current) => {
          if (current && r.some((room) => room.id === current)) return current;
          const url = new URLSearchParams(window.location.search);
          const pre = url.get("room");
          if (pre && r.some((room) => room.id === pre)) return pre;
          return r[0]?.id ?? "";
        });
      })
      .finally(() => setLoaded(true));
  }, []);

  // Only fills in blanks — won't clobber a restored draft's contact info.
  useEffect(() => {
    if (user) {
      setName((v) => v || user.fullName);
      setEmail((v) => v || user.email);
      setPhone((v) => v || user.phone);
    }
  }, [user]);

  function toggleAddon(id: string) {
    setAddonIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  // Everything is required except Notes. Shared by the disabled-submit state
  // and the submit handler itself, so both agree on what's valid.
  function getFieldErrors(): FieldErrors {
    const errs: FieldErrors = {};
    if (!category) errs.category = "Please select an event category.";
    if (!roomId) errs.room = "Please select a room.";
    if (!date) errs.date = "Please choose an event date.";
    else if (date < MIN_DATE) errs.date = "Event date must be at least 7 days from today.";
    if (!time) errs.time = "Please choose a start time.";
    const durationNum = Number(duration);
    if (!duration.trim() || !Number.isInteger(durationNum) || durationNum < 1) {
      errs.duration = "Duration must be a whole number of at least 1.";
    } else if (time && overlapsBookedRange(time, durationNum, bookedRanges)) {
      errs.time = "This time overlaps an existing booking. Please choose a different time or duration.";
    }
    if (!name.trim()) errs.name = "Please provide your full name.";
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

    const draft: Draft = {
      category,
      roomId,
      addonIds,
      date,
      time,
      duration,
      notes,
      name,
      email,
      phone,
    };

    // Require an account before an inquiry is actually created — save the
    // filled-in form so it's restored after they sign in or sign up.
    if (!user) {
      saveDraft(draft);
      setShowAuthPrompt(true);
      return;
    }

    setSubmitting(true);
    try {
      const body = {
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
      };
      const res = await api.post<{ ref: string }>("/inquiries", body);
      clearDraft();
      setSuccessRef(res.ref);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (successRef) {
    return (
      <div className="bg-white min-h-screen">
        <NavBar />
        <div className="max-w-lg mx-auto px-6 py-24">
          <Reveal className="relative border border-[var(--surface-border)] bg-[var(--surface)] p-10 text-center flex flex-col items-center gap-4">
            <span className="absolute top-0 left-10 right-10 h-px bg-[linear-gradient(90deg,transparent,var(--color-gold),transparent)]" />
            <Icon name="checkCircle" className="w-9 h-9 text-gold-dim" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-dim">
              Inquiry received
            </p>
            <h1 className="font-display text-3xl italic text-ink">Thank you</h1>
            <p className="text-sm text-ink/60 leading-relaxed">
              Your inquiry reference is{" "}
              <span className="font-display text-lg text-mahogany not-italic">{successRef}</span>.
              Our team will contact you via WhatsApp to discuss pricing and
              availability.
            </p>
            <div className="flex gap-3 justify-center mt-2">
              <Link href="/profile">
                <Btn>Track in my bookings</Btn>
              </Link>
              <Link href="/">
                <OutlineBtn>Back home</OutlineBtn>
              </Link>
            </div>
          </Reveal>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <NavBar />
      <FloatingWA />

      <div className="max-w-screen-xl mx-auto px-6 md:px-16 py-12 flex flex-col lg:flex-row gap-10 items-start">
        <div className="flex-1 flex flex-col gap-12 w-full">
          <Reveal>
            <SLabel>Inquiry Form</SLabel>
            <h1 className="font-display text-3xl md:text-4xl italic text-ink">
              Submit an inquiry
            </h1>
            <p className="text-sm text-ink/55 mt-2">
              Tell us about your event. No payment now — we&apos;ll follow up
              with pricing.
            </p>
          </Reveal>

          {!loaded ? (
            <Spinner />
          ) : (
            <>
              {/* Category */}
              <FormSection icon="spark" title="Select event category">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`text-left text-sm px-4 py-3 border cursor-pointer transition-colors duration-150 ${
                        category === cat
                          ? "border-gold bg-gold/10 text-ink font-semibold"
                          : "border-[var(--surface-border)] bg-[var(--surface)] text-ink/65 hover:border-gold-dim"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {showErrors("category") && (
                  <p className="text-xs text-danger mt-2">{fieldErrors.category}</p>
                )}
              </FormSection>

              {/* Room */}
              <FormSection icon="building" title="Select a room">
                <div className="flex flex-col gap-3">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setRoomId(room.id)}
                      className={`flex items-center gap-4 border bg-[var(--surface)] p-4 text-left cursor-pointer transition-colors duration-150 ${
                        roomId === room.id
                          ? "border-gold"
                          : "border-[var(--surface-border)] hover:border-gold-dim"
                      }`}
                    >
                      <PhotoBox
                        label="Room"
                        icon="building"
                        className="w-24 h-16 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink">
                          {room.name}
                        </p>
                        <p className="text-xs text-ink/50">
                          {room.capacity} · {room.area}
                        </p>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${
                          roomId === room.id
                            ? "border-gold bg-gold"
                            : "border-[var(--surface-border-strong)]"
                        }`}
                      >
                        {roomId === room.id && (
                          <Icon name="check" className="w-3 h-3 text-mahogany-2" strokeWidth={2.5} />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                {showErrors("room") && (
                  <p className="text-xs text-danger mt-2">{fieldErrors.room}</p>
                )}
              </FormSection>

              {/* Date/time */}
              <FormSection icon="calendar" title="Date & time">
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
              </FormSection>

              {/* Add-ons */}
              {addons.length > 0 && (
                <FormSection icon="plus" title="Add-ons">
                  <div className="flex flex-col gap-3">
                    {addons.map((a) => (
                      <label
                        key={a.id}
                        className={`border bg-[var(--surface)] px-4 py-4 flex items-start gap-3 cursor-pointer transition-colors duration-150 ${
                          addonIds.includes(a.id)
                            ? "border-gold"
                            : "border-[var(--surface-border)] hover:border-gold-dim"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={addonIds.includes(a.id)}
                          onChange={() => toggleAddon(a.id)}
                          className="gold-checkbox mt-1"
                        />
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {a.name}
                          </p>
                          <p className="text-xs text-ink/50 mt-1">
                            {a.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </FormSection>
              )}

              {/* Contact + notes */}
              <FormSection icon="user" title="Your details">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <TextField
                    label="Full name"
                    placeholder="e.g. Jane Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={showErrors("name")}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    placeholder="e.g. jane@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={showErrors("email")}
                  />
                  <TextField
                    label="Phone"
                    type="tel"
                    placeholder="e.g. 0812 3456 7890"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={showErrors("phone")}
                  />
                </div>
                <TextArea
                  label="Notes / additional requests"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your event requirements, technical needs, etc."
                />
              </FormSection>
            </>
          )}
        </div>

        {/* Summary */}
        <Reveal
          delay={150}
          className="w-full lg:w-80 flex-shrink-0 relative border border-gold-dim/40 bg-cream p-6 lg:sticky lg:top-28 flex flex-col gap-4"
        >
          <span className="absolute top-0 left-8 right-8 h-px bg-[linear-gradient(90deg,transparent,var(--color-gold),transparent)]" />
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink border-b border-[var(--surface-border)] pb-3">
            <Icon name="handshake" className="w-4 h-4 text-gold-dim" />
            Inquiry summary
          </h3>
          <div className="flex flex-col gap-3 text-xs">
            <Row label="Room" value={rooms.find((r) => r.id === roomId)?.name} />
            <Row label="Category" value={category} />
            <Row label="Date" value={date} />
            <Row label="Start time" value={time} />
            <Row label="Duration" value={duration} />
            <Row
              label="Add-ons"
              value={
                addonIds.length
                  ? addons
                      .filter((a) => addonIds.includes(a.id))
                      .map((a) => a.name)
                      .join(", ")
                  : "None"
              }
            />
          </div>
          {error && <Alert>{error}</Alert>}
          <Btn full disabled={submitting} onClick={submit}>
            {submitting ? "Submitting…" : "Submit inquiry"}
          </Btn>
          {!user && (
            <p className="text-[10px] text-ink/40 text-center leading-relaxed">
              You&apos;ll be asked to sign in or create an account to submit —
              your form details will be kept.
            </p>
          )}
          <p className="flex items-start gap-1.5 text-[10px] text-ink/50 text-center leading-relaxed">
            <Icon name="whatsapp" className="w-3.5 h-3.5 text-gold-dim flex-shrink-0 mt-0.5" />
            Our team will contact you via WhatsApp to discuss pricing and
            availability.
          </p>
        </Reveal>
      </div>

      <Modal open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)}>
        <Icon name="user" className="w-7 h-7 text-gold-dim mb-1" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-dim mb-1">
          Sign In Required
        </p>
        <h2 className="font-display text-2xl text-ink mb-2">
          Log in to submit your inquiry
        </h2>
        <p className="text-sm text-ink/55 leading-relaxed mb-6">
          Your form details are saved — you&apos;ll pick up right where you
          left off after you sign in or create an account.
        </p>
        <div className="flex flex-col gap-3">
          <Btn full onClick={() => router.push("/login?next=/booking")}>
            Log In
          </Btn>
          <OutlineBtn full onClick={() => router.push("/register?next=/booking")}>
            Create Account
          </OutlineBtn>
          <button
            onClick={() => setShowAuthPrompt(false)}
            className="text-xs text-ink/45 hover:text-ink/70 transition-colors cursor-pointer mt-1"
          >
            Cancel
          </button>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}

function FormSection({
  icon,
  title,
  children,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <h2 className="flex items-center gap-2.5 text-base font-semibold text-ink mb-4 border-b border-[var(--surface-border)] pb-3">
        <Icon name={icon} className="w-4 h-4 text-gold-dim" />
        {title}
      </h2>
      {children}
    </Reveal>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-ink/50 flex-shrink-0">{label}</span>
      <span className="font-semibold text-ink text-right">
        {value || "— not set —"}
      </span>
    </div>
  );
}
