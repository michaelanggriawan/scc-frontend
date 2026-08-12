"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavBar, Footer, FloatingWA } from "@/components/site";
import { Btn, Icon, Reveal, SLabel, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { Room } from "@/lib/types";

const VENUE_FACTS = [
  ["calendar", "Floor Dimension", "42m × 24m — pillar-free convention space"],
  ["building", "Clear Height", "8 meters — ideal for high stage rigging and lighting"],
  ["plug", "Power Capacity", "Large-scale integrated power system, ready for concerts & multimedia"],
  ["car", "Loading Access", "Direct loading dock access for fast crew and vendor mobilization"],
] as const;

export default function VenuePage() {
  const [rooms, setRooms] = useState<Room[] | null>(null);

  useEffect(() => {
    api.get<Room[]>("/public/rooms").then(setRooms).catch(() => setRooms([]));
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <NavBar />
      <FloatingWA />

      <main id="main">
        <section className="relative w-full h-[380px]">
          <Image
            src="https://picsum.photos/seed/scc-venue-hero/1600/700"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover [filter:sepia(0.45)_saturate(1.5)_hue-rotate(-28deg)_brightness(0.6)_contrast(1.05)]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,2,1,0.4)_0%,rgba(42,2,1,0.9)_100%)]" />
          <div className="grain-overlay" />
          <div className="relative h-full flex flex-col justify-end pb-12 px-6 md:px-16">
            <Reveal className="max-w-screen-xl mx-auto w-full">
              <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.28em] text-gold mb-4">
                <span className="w-8 h-px bg-gold" />
                SCC Venue
              </p>
              <h1 className="font-display text-4xl md:text-5xl italic text-white">
                Our Rooms &amp; Specs
              </h1>
              <p className="text-sm text-white/75 mt-3">
                Production-ready spaces with full technical fit-out.
              </p>
            </Reveal>
          </div>
        </section>

        <div className="bg-cream border-b border-mahogany/10 px-6 md:px-16 py-14">
          <div className="max-w-screen-xl mx-auto">
            <SLabel>Grand Venue Info</SLabel>
            <h2 className="font-display text-3xl text-ink mb-8">
              Facility Specifications
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {VENUE_FACTS.map(([icon, label, desc], i) => (
                <Reveal
                  key={label}
                  delay={i * 90}
                  className="border border-mahogany/10 bg-white p-5 flex flex-col gap-3"
                >
                  <Icon name={icon} className="w-5 h-5 text-mahogany" />
                  <p className="text-xs font-semibold text-ink">{label}</p>
                  <p className="text-xs text-ink/50 leading-relaxed">{desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-6 md:px-16 py-16 flex flex-col gap-20">
          {rooms === null ? (
            <Spinner />
          ) : rooms.length === 0 ? (
            <p className="text-sm text-ink/50">No rooms are available right now.</p>
          ) : (
            rooms.map((room) => <RoomBlock key={room.id} room={room} />)
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function RoomBlock({ room }: { room: Room }) {
  return (
    <div className="flex flex-col lg:flex-row gap-10 items-start">
      <Reveal className="flex-1 flex flex-col gap-10">
        <div>
          <SLabel>Room</SLabel>
          <h2 className="font-display text-3xl text-ink">{room.name}</h2>
          <p className="text-sm text-mahogany mt-2 tracking-wide">
            {room.capacity} · {room.area}
          </p>
          {room.description && (
            <p className="text-sm text-ink/60 mt-4 leading-relaxed max-w-2xl">
              {room.description}
            </p>
          )}
        </div>

        {room.facilities?.length > 0 && (
          <div>
            <SLabel>Facilities</SLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {room.facilities.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 bg-cream border border-mahogany/10 px-4 py-3"
                >
                  <Icon name="check" className="w-3.5 h-3.5 mt-0.5 text-mahogany flex-shrink-0" />
                  <span className="text-xs text-ink/80">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {room.specs?.some((s) => s.spec) && (
          <div>
            <SLabel>Technical Specifications</SLabel>
            <div className="border border-mahogany/10 bg-white overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="bg-cream border-b border-mahogany/10">
                    <th className="text-left text-xs font-semibold text-gold-dim uppercase tracking-wider px-5 py-3 w-40">
                      System
                    </th>
                    <th className="text-left text-xs font-semibold text-gold-dim uppercase tracking-wider px-5 py-3">
                      Specification
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {room.specs
                    .filter((s) => s.spec)
                    .map((s, i) => (
                      <tr
                        key={s.system}
                        className={`border-b border-mahogany/10 last:border-0 ${
                          i % 2 === 1 ? "bg-cream/60" : ""
                        }`}
                      >
                        <td className="px-5 py-3 text-xs font-semibold text-ink">
                          {s.system}
                        </td>
                        <td className="px-5 py-3 text-xs text-ink/60">
                          {s.spec}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Reveal>

      <Reveal
        delay={120}
        className="w-full lg:w-72 flex-shrink-0 border border-gold-dim/40 bg-cream p-7 flex flex-col gap-4 lg:sticky lg:top-28"
      >
        <p className="font-display text-xl text-ink">{room.name}</p>
        <div className="flex flex-col gap-2 text-xs text-ink/60">
          <span className="flex items-center gap-2">
            <Icon name="users" className="w-4 h-4 text-gold-dim" />
            {room.capacity}
          </span>
          <span className="flex items-center gap-2">
            <Icon name="building" className="w-4 h-4 text-gold-dim" />
            {room.area}
          </span>
        </div>
        <Link href={`/booking?room=${room.id}`}>
          <Btn full>Submit an Inquiry</Btn>
        </Link>
      </Reveal>
    </div>
  );
}
