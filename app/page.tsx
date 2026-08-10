import Link from "next/link";
import { NavBar, Footer, FloatingWA } from "@/components/site";
import { Btn, IconBox, PhotoBox, SLabel, SWrap } from "@/components/ui";

const EVENT_TYPES = [
  "Corporate Conference",
  "Exhibition & Trade Show",
  "Concert & Live Show",
  "Wedding & Social",
  "Government & Ceremony",
  "Hybrid / Virtual",
];

const REASONS = [
  ["Built-in Production", "LED wall, line-array sound, rigging and lighting ready out of the box."],
  ["Flexible Configurations", "One expansive hall that reshapes to your event, from 100 to thousands."],
  ["Senior Event Support", "A dedicated team guiding you from site visit to event day."],
];

const STEPS = [
  ["01", "Consultation", "Reach out to share requirements, preferred dates, and technical demands."],
  ["02", "Site Visit", "Walk the hall, test viewing angles, inspect loading logistics."],
  ["03", "Proposal", "Receive a tailored plan and a clear cost breakdown."],
  ["04", "Event Day", "Watch your vision unfold, guided by our support staff."],
];

export default function HomePage() {
  return (
    <div className="bg-[#F7F7F7] min-h-screen">
      <NavBar />
      <FloatingWA />

      {/* Hero */}
      <section className="relative">
        <PhotoBox label="[ Hero Photo ]" className="w-full h-[520px]" />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-end pb-14 px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-3">
            SCC Venue
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            One Hall. Every Kind of Event.
          </h1>
          <p className="text-sm text-white/80 mb-8 max-w-xl">
            A production-ready convention hall for conferences, concerts,
            exhibitions and celebrations.
          </p>
          <div className="flex gap-3">
            <Link href="/booking">
              <Btn>Book Now</Btn>
            </Link>
            <Link href="/venue">
              <button className="border border-white text-white bg-transparent font-semibold px-6 py-3 text-sm cursor-pointer hover:bg-white/10">
                View the Venue
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Event types */}
      <SWrap>
        <SLabel>Versatile Spaces</SLabel>
        <h2 className="text-xl font-bold text-[#222] mb-8">Built for Any Event</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {EVENT_TYPES.map((e) => (
            <div
              key={e}
              className="border border-[#D1D1D1] bg-white p-5 flex flex-col gap-2"
            >
              <IconBox className="w-8 h-8" />
              <p className="text-sm font-bold text-[#222]">{e}</p>
              <p className="text-xs text-[#AAAAAA]">
                Tailored layouts, staffing and production for every format.
              </p>
            </div>
          ))}
        </div>
      </SWrap>

      {/* Why */}
      <SWrap bg="bg-white border-y border-[#D1D1D1]">
        <SLabel>Why SCC</SLabel>
        <h2 className="text-xl font-bold text-[#222] mb-10">
          Why Choose Our Venue
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REASONS.map(([t, d]) => (
            <div key={t} className="flex flex-col gap-3">
              <IconBox className="w-10 h-10" />
              <p className="text-sm font-bold text-[#222]">{t}</p>
              <p className="text-sm text-[#777] leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </SWrap>

      {/* Process */}
      <SWrap>
        <SLabel>How It Works</SLabel>
        <h2 className="text-xl font-bold text-[#222] mb-10">
          The Booking Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-[#D1D1D1]">
          {STEPS.map(([step, title, body], i) => (
            <div
              key={step}
              className={`bg-white p-6 flex flex-col gap-3 ${
                i < 3 ? "md:border-r border-[#D1D1D1]" : ""
              }`}
            >
              <p className="text-3xl font-bold text-[#D1D1D1]">{step}</p>
              <p className="text-sm font-bold text-[#222]">{title}</p>
              <p className="text-xs text-[#666] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/booking">
            <Btn>Submit an Inquiry</Btn>
          </Link>
        </div>
      </SWrap>

      {/* Gallery */}
      <SWrap bg="bg-white border-y border-[#D1D1D1]">
        <SLabel>Gallery</SLabel>
        <h2 className="text-xl font-bold text-[#222] mb-8">Inside the Hall</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <PhotoBox key={n} label={`[ Photo ${n} ]`} className="h-52" />
          ))}
        </div>
      </SWrap>

      <Footer />
    </div>
  );
}
