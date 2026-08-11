"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavBar, Footer, FloatingWA } from "@/components/site";
import { Btn, IconBox, PhotoBox, SLabel, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { Room } from "@/lib/types";

const VENUE_FACTS = [
  ["Floor Dimension", "42m × 24m — pillar-free convention space"],
  ["Clear Height", "8 meters — ideal for high stage rigging and lighting"],
  ["Power Capacity", "Large-scale integrated power system, ready for concerts & multimedia"],
  ["Loading Access", "Direct loading dock access for fast crew and vendor mobilization"],
];

export default function VenuePage() {
  const [rooms, setRooms] = useState<Room[] | null>(null);

  useEffect(() => {
    api.get<Room[]>("/public/rooms").then(setRooms).catch(() => setRooms([]));
  }, []);

  return (
    <div className="bg-[#F7F7F7] min-h-screen">
      <NavBar />
      <FloatingWA />

      <section className="relative">
        <PhotoBox label="[ Venue Hero Photo ]" className="w-full h-[340px]" />
        <div className="absolute inset-0 bg-black/30 flex flex-col justify-end pb-10 px-6 md:px-16">
          <div className="max-w-screen-xl mx-auto w-full">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">
              SCC Venue
            </p>
            <h1 className="text-3xl font-bold text-white">Our Rooms & Specs</h1>
            <p className="text-sm text-white/80 mt-1">
              Production-ready spaces with full technical fit-out.
            </p>
          </div>
        </div>
      </section>

      <div className="bg-white border-b border-[#D1D1D1] px-6 md:px-16 py-10">
        <div className="max-w-screen-xl mx-auto">
          <SLabel>Grand Venue Info</SLabel>
          <h2 className="text-xl font-bold text-[#222] mb-6">
            Facility Specifications
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {VENUE_FACTS.map(([label, desc]) => (
              <div key={label} className="border border-[#D1D1D1] p-4 flex flex-col gap-1">
                <p className="text-xs font-bold text-[#222]">{label}</p>
                <p className="text-xs text-[#777] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-[#555]">
            Special rate: starting from{" "}
            <span className="font-bold text-[#222]">Rp 20,000,000</span>
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 md:px-16 py-12 flex flex-col gap-16">
        {rooms === null ? (
          <Spinner />
        ) : rooms.length === 0 ? (
          <p className="text-sm text-[#888]">No rooms are available right now.</p>
        ) : (
          rooms.map((room) => <RoomBlock key={room.id} room={room} />)
        )}
      </div>

      <Footer />
    </div>
  );
}

function RoomBlock({ room }: { room: Room }) {
  return (
    <div className="flex flex-col lg:flex-row gap-10 items-start">
      <div className="flex-1 flex flex-col gap-8">
        <div>
          <SLabel>Room</SLabel>
          <h2 className="text-2xl font-bold text-[#222]">{room.name}</h2>
          <p className="text-sm text-[#888] mt-1">
            {room.capacity} · {room.area}
          </p>
          {room.description && (
            <p className="text-sm text-[#555] mt-3 leading-relaxed max-w-2xl">
              {room.description}
            </p>
          )}
        </div>

        {room.facilities?.length > 0 && (
          <div>
            <SLabel>Facilities</SLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              {room.facilities.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 bg-white border border-[#D1D1D1] px-4 py-3"
                >
                  <IconBox className="w-3 h-3 mt-0.5" />
                  <span className="text-xs text-[#444]">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {room.specs?.some((s) => s.spec) && (
          <div>
            <SLabel>Technical Specifications</SLabel>
            <div className="border border-[#D1D1D1] bg-white overflow-x-auto mt-2">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="bg-[#EBEBEB] border-b border-[#D1D1D1]">
                    <th className="text-left text-xs font-semibold text-[#555] uppercase tracking-wider px-5 py-3 w-40">
                      System
                    </th>
                    <th className="text-left text-xs font-semibold text-[#555] uppercase tracking-wider px-5 py-3">
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
                        className={`border-b border-[#EBEBEB] last:border-0 ${
                          i % 2 === 1 ? "bg-[#FAFAFA]" : ""
                        }`}
                      >
                        <td className="px-5 py-3 text-xs font-bold text-[#333]">
                          {s.system}
                        </td>
                        <td className="px-5 py-3 text-xs text-[#555]">
                          {s.spec}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="w-full lg:w-72 flex-shrink-0 border border-[#222] bg-white p-6 flex flex-col gap-3 lg:sticky lg:top-20">
        <p className="text-sm font-bold text-[#222]">{room.name}</p>
        <div className="flex flex-col gap-1 text-xs text-[#888]">
          <span>{room.capacity}</span>
          <span>{room.area}</span>
        </div>
        <Link href={`/booking?room=${room.id}`}>
          <Btn full>Submit an Inquiry</Btn>
        </Link>
      </div>
    </div>
  );
}
