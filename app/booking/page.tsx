"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import type { AddOn, Room } from "@/lib/types";

export default function BookingPage() {
  const { user } = useAuth();
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
  const [successRef, setSuccessRef] = useState("");

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
        const url = new URLSearchParams(window.location.search);
        const pre = url.get("room");
        if (pre && r.some((room) => room.id === pre)) setRoomId(pre);
        else if (r[0]) setRoomId(r[0].id);
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.fullName);
      setEmail(user.email);
      setPhone(user.phone);
    }
  }, [user]);

  function toggleAddon(id: string) {
    setAddonIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  async function submit() {
    setError("");
    // Everything is required except Notes.
    if (!category) {
      setError("Please select an event category.");
      return;
    }
    if (!roomId) {
      setError("Please select a room.");
      return;
    }
    if (!date) {
      setError("Please choose an event date.");
      return;
    }
    if (!time) {
      setError("Please choose a start time.");
      return;
    }
    if (!duration.trim()) {
      setError("Please enter the event duration.");
      return;
    }
    if (!name.trim()) {
      setError("Please provide your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please provide your email.");
      return;
    }
    if (!phone.trim()) {
      setError("Please provide your phone number.");
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
      // Logged-in customers get their inquiry linked to their account.
      const path = user ? "/inquiries" : "/public/inquiries";
      const res = await api.post<{ ref: string }>(path, body);
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
            {user ? (
              <Link href="/profile">
                <Btn>Track in My Bookings</Btn>
              </Link>
            ) : (
              <Link href="/login">
                <Btn>Log in to track it</Btn>
              </Link>
            )}
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
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <TextField
                    label="Start Time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                  <TextField
                    label="Duration"
                    placeholder="e.g. 8 hours"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <TextField
                    label="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
