"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavBar, Footer, FloatingWA } from "@/components/site";
import {
  Alert,
  Btn,
  PhotoBox,
  SLabel,
  Spinner,
  TextArea,
  TextField,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  blockNonDigitKeys,
  blockNonDigitPaste,
  isValidEmail,
  isValidPhone,
  minBookingDate,
} from "@/lib/validation";
import type { AddOn, Room } from "@/lib/types";

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
    setTime(draft.time ?? "");
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
    // filled-in form so it's restored after they sign up.
    if (!user) {
      saveDraft(draft);
      router.push("/register?next=/booking");
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
      <div className="bg-[#F7F7F7] min-h-screen">
        <NavBar />
        <div className="max-w-lg mx-auto px-6 py-24 text-center flex flex-col gap-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888]">
            Inquiry Received
          </p>
          <h1 className="text-2xl font-bold text-[#222]">Thank you!</h1>
          <p className="text-sm text-[#555]">
            Your inquiry reference is{" "}
            <span className="font-bold text-[#222]">{successRef}</span>. Our team
            will contact you via WhatsApp to discuss pricing and availability.
          </p>
          <div className="flex gap-3 justify-center mt-2">
            <Link href="/profile">
              <Btn>Track in My Bookings</Btn>
            </Link>
            <Link href="/">
              <button className="border border-[#222] bg-white text-[#222] font-semibold px-6 py-3 text-sm cursor-pointer">
                Back Home
              </button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#F7F7F7] min-h-screen">
      <NavBar />
      <FloatingWA />

      <div className="max-w-screen-xl mx-auto px-6 md:px-16 py-12 flex flex-col lg:flex-row gap-10 items-start">
        <div className="flex-1 flex flex-col gap-10 w-full">
          <div>
            <SLabel>Inquiry Form</SLabel>
            <h1 className="text-2xl font-bold text-[#222]">Submit an Inquiry</h1>
            <p className="text-sm text-[#888] mt-1">
              Tell us about your event. No payment now — we&apos;ll follow up
              with pricing.
            </p>
          </div>

          {!loaded ? (
            <Spinner />
          ) : (
            <>
              {/* Category */}
              <div>
                <h2 className="text-base font-bold text-[#222] mb-4 border-b border-[#D1D1D1] pb-2">
                  Select Event Category
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`text-left text-sm px-4 py-3 border cursor-pointer ${
                        category === cat
                          ? "border-[#222] bg-[#222] text-white font-semibold"
                          : "border-[#D1D1D1] bg-white text-[#444]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {showErrors("category") && (
                  <p className="text-xs text-[#c33] mt-2">{fieldErrors.category}</p>
                )}
              </div>

              {/* Room */}
              <div>
                <h2 className="text-base font-bold text-[#222] mb-4 border-b border-[#D1D1D1] pb-2">
                  Select a Room
                </h2>
                <div className="flex flex-col gap-2">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setRoomId(room.id)}
                      className={`flex items-center gap-4 border bg-white p-4 text-left cursor-pointer ${
                        roomId === room.id ? "border-2 border-[#222]" : "border-[#D1D1D1]"
                      }`}
                    >
                      <PhotoBox
                        label="[ Room ]"
                        className="w-24 h-16 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#222]">
                          {room.name}
                        </p>
                        <p className="text-xs text-[#888]">
                          {room.capacity} · {room.area}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 border-2 flex-shrink-0 ${
                          roomId === room.id
                            ? "border-[#222] bg-[#222]"
                            : "border-[#AAAAAA]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {showErrors("room") && (
                  <p className="text-xs text-[#c33] mt-2">{fieldErrors.room}</p>
                )}
              </div>

              {/* Date/time */}
              <div>
                <h2 className="text-base font-bold text-[#222] mb-4 border-b border-[#D1D1D1] pb-2">
                  Date & Time
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <TextField
                    label="Date"
                    type="date"
                    min={MIN_DATE}
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    error={showErrors("date")}
                  />
                  <TextField
                    label="Start Time"
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    error={showErrors("time")}
                  />
                  <TextField
                    label="Duration (hours)"
                    type="number"
                    min={1}
                    step={1}
                    required
                    placeholder="e.g. 8"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    onKeyDown={blockNonDigitKeys}
                    onPaste={blockNonDigitPaste}
                    error={showErrors("duration")}
                  />
                </div>
              </div>

              {/* Add-ons */}
              {addons.length > 0 && (
                <div>
                  <h2 className="text-base font-bold text-[#222] mb-4 border-b border-[#D1D1D1] pb-2">
                    Add-ons
                  </h2>
                  <div className="flex flex-col gap-2">
                    {addons.map((a) => (
                      <label
                        key={a.id}
                        className="border border-[#D1D1D1] bg-white px-4 py-4 flex items-start gap-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={addonIds.includes(a.id)}
                          onChange={() => toggleAddon(a.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#222]">
                            {a.name}
                          </p>
                          <p className="text-xs text-[#666] mt-1">
                            {a.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact + notes */}
              <div>
                <h2 className="text-base font-bold text-[#222] mb-4 border-b border-[#D1D1D1] pb-2">
                  Your Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <TextField
                    label="Full Name"
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
                  label="Notes / Additional Requests"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your event requirements, technical needs, etc."
                />
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="w-full lg:w-80 flex-shrink-0 border border-[#D1D1D1] bg-white p-6 lg:sticky lg:top-20 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-[#222] border-b border-[#D1D1D1] pb-3">
            Inquiry Summary
          </h3>
          <div className="flex flex-col gap-3 text-xs">
            <Row label="Room" value={rooms.find((r) => r.id === roomId)?.name} />
            <Row label="Category" value={category} />
            <Row label="Date" value={date} />
            <Row label="Start Time" value={time} />
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
            {submitting ? "Submitting…" : "Submit Inquiry"}
          </Btn>
          {!user && (
            <p className="text-[10px] text-[#AAAAAA] text-center leading-relaxed">
              You&apos;ll be asked to sign in or create an account to submit —
              your form details will be kept.
            </p>
          )}
          <p className="text-[10px] text-[#888] text-center leading-relaxed">
            Our team will contact you via WhatsApp to discuss pricing and
            availability.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[#666] flex-shrink-0">{label}</span>
      <span className="font-semibold text-[#333] text-right">
        {value || "— not set —"}
      </span>
    </div>
  );
}
