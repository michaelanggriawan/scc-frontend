import Image from "next/image";
import Link from "next/link";
import { NavBar, Footer, FloatingWA } from "@/components/site";
import { AnimatedStat, Btn, IconBox, PhotoBox, SLabel, SWrap } from "@/components/ui";

const VENUE_MAPS_URL =
  "https://maps.google.com/?cid=15856071987079643264&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ";
const VENUE_MAPS_EMBED_URL = "https://maps.google.com/maps?cid=15856071987079643264&output=embed";

const STATS = [
  ["1008 m²", "Pillar-Free Main Hall"],
  ["1000+", "Maximum Guest Capacity"],
  ["14m × 8m", "High-Capacity Structural Stage"],
  ["300", "Spacious Parking Area"],
];

const EVENT_TYPES = [
  [
    "Conference",
    "Pillar-free visibility and high-performance acoustic treatment for optimal delegate engagement.",
  ],
  [
    "Exhibition & Expo",
    "A spacious area equipped with modular under-floor utilities (trenches) for clean and organized electrical and water access.",
  ],
  [
    "Corporate Summit",
    "Exclusive VIP meeting suites with secure, high-speed fiber internet connection.",
  ],
  [
    "Concerts & Live Performances",
    "Flexible stage area featuring private backstage green rooms for various performance scales.",
  ],
  [
    "House of Worship",
    "Precision-engineered room acoustics designed for speech clarity and full-band live music.",
  ],
  [
    "Product Launches",
    "A dynamic space tailored to create a stunning first impression, ideal for introducing your latest innovations and products to the public.",
  ],
];

const PRODUCTION_SYSTEMS = [
  [
    "Visual & LED Systems",
    [
      "14m × 3m P2.5 indoor LED wall for razor-sharp visuals",
      "Novastar VX1000 professional video processor with integrated HDMI input",
      "Dedicated media server (Intel Core i7-14700, NVIDIA GeForce RTX 5070 Ti) for lag-free video mapping",
      "Delivery, installation, signal cabling, and a standby technician included for the full event",
    ],
  ],
  [
    "Audio Systems",
    [
      "Behringer Wing digital ecosystem as the central control system",
      "ZSOUND LA210 line array & S218B subwoofers for crystal-clear vocals and precise bass",
      "Scales from 300-pax ballroom packages up to full concert rigs for 500–1,000+ pax",
    ],
  ],
  [
    "Stage Lighting",
    [
      "LED Par (color wash) and Fresnel face lighting for meetings up to 100 pax",
      "Moving head beams and a hazer machine for atmospheric corporate events up to 250 pax",
      "Full controller console system operated by a dedicated lighting crew",
    ],
  ],
];

const REASONS = [
  [
    "Built-in Production",
    "Cut down massive external vendor expenses. High-resolution P2.5 LED screens and concert-grade sound systems are already integrated directly as standard built-in facilities.",
  ],
  [
    "1,008 m² Pillarless Space",
    "A spacious 42 x 24 meter layout with zero obstructing columns, maximizing seating capacity and ensuring a crystal-clear, unobstructed view for every attendee.",
  ],
  [
    "Smart Investment & Maximum Cost-Efficiency",
    "Gain professional-grade convention facilities with a much more rational financial structure—securing your event's profit margins without ever compromising on quality.",
  ],
];

const STEPS = [
  ["01", "Consultation", "Reach out to share requirements, preferred dates, and technical demands."],
  ["02", "Site Visit", "Walk the hall, test viewing angles, inspect loading logistics."],
  ["03", "Proposal", "Receive a tailored plan and a clear cost breakdown."],
  ["04", "Event Day", "Watch your vision unfold, guided by our support staff."],
];

const TESTIMONIALS = [
  [
    "Hall tanpa pilar dan akses loading dock SCC memangkas waktu setup kontraktor kami hingga empat jam. Tim fasilitas mereka memiliki ritme kerja yang sama cepatnya dengan kami.",
    "Hendrik Kurniawan",
    "Managing Director, B2B Exhibition Agency",
  ],
  [
    "Menyelenggarakan summit menteri menuntut protokol keamanan ketat dan AV tanpa cela. Ruang VIP dan manajemen alur kerumunan di area pre-function sangat luar biasa.",
    "Anissa Pratama",
    "Head of Protocol & Procurement",
  ],
  [
    "Untuk ibadah dengan dua ribu jemaat, kejernihan suara adalah hal yang mutlak. Tim teknis SCC sangat memahami tata suara live dan bekerja harmonis dengan kru internal kami.",
    "Daniel Saputra",
    "Production Director",
  ],
];

const GETTING_HERE = [
  "5 minutes from the Jakarta–Serpong Toll Exit",
  "40 minutes via toll road to Soekarno–Hatta International Airport (Bandar Udara Internasional Soekarno–Hatta)",
  "Parking area for 300+ vehicles with a dedicated loading/unloading zone.",
];

export default function HomePage() {
  return (
    <div className="bg-[#F7F7F7] min-h-screen">
      <NavBar />
      <FloatingWA />

      {/* Hero */}
      <section className="relative w-full h-[520px]">
        <Image
          src="/hero.jpeg"
          alt="Serpong Convention Center"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-end pb-14 px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-3">
            Serpong Convention Center
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            One Venue, Endless Possibilities
          </h1>
          <p className="text-sm text-white/80 mb-2 max-w-xl">
            Column-Free Convention Venue Designed for High-Impact Conferences,
            Exhibitions, Corporate Summits, and Large-Scale Live Productions.
          </p>
          <p className="text-xs text-white/60 mb-8 max-w-xl">
            1008 m² of versatile space right in the heart of Tangerang.
          </p>
          <div className="flex gap-3">
            <Link href="/booking">
              <Btn>Book Now</Btn>
            </Link>
            <Link href="/venue">
              <button className="border border-white text-white bg-transparent font-semibold px-6 py-3 text-sm cursor-pointer hover:bg-white/10">
                Plan Visit
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <SWrap bg="bg-white border-b border-[#D1D1D1]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(([stat, label]) => (
            <div key={label} className="flex flex-col items-center gap-1 text-center">
              <AnimatedStat value={stat} className="text-2xl md:text-3xl font-bold text-[#222]" />
              <p className="text-xs text-[#888]">{label}</p>
            </div>
          ))}
        </div>
      </SWrap>

      {/* Versatile Spaces */}
      <SWrap>
        <SLabel>Flexible Space</SLabel>
        <h2 className="text-xl font-bold text-[#222] mb-8">
          Custom Configurations for Every Event Format
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {EVENT_TYPES.map(([name, desc]) => (
            <div
              key={name}
              className="border border-[#D1D1D1] bg-white p-5 flex flex-col gap-2"
            >
              <IconBox className="w-8 h-8" />
              <p className="text-sm font-bold text-[#222]">{name}</p>
              <p className="text-xs text-[#AAAAAA]">{desc}</p>
            </div>
          ))}
        </div>
      </SWrap>

      {/* Why SCC */}
      <SWrap bg="bg-white border-y border-[#D1D1D1]">
        <SLabel>Why SCC</SLabel>
        <h2 className="text-xl font-bold text-[#222] mb-10">
          Smart Investment, Maximum Efficiency
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

      {/* Production Systems */}
      <SWrap>
        <SLabel>Production Systems</SLabel>
        <h2 className="text-xl font-bold text-[#222] mb-10">
          Built-In Visual, Audio & Lighting Infrastructure
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRODUCTION_SYSTEMS.map(([title, points]) => (
            <div key={title as string} className="flex flex-col gap-3">
              <IconBox className="w-10 h-10" />
              <p className="text-sm font-bold text-[#222]">{title}</p>
              <ul className="flex flex-col gap-2">
                {(points as string[]).map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <IconBox className="w-2 h-2 mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-[#777] leading-relaxed">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SWrap>

      {/* Process */}
      <SWrap bg="bg-white border-y border-[#D1D1D1]">
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
      <SWrap>
        <SLabel>Gallery</SLabel>
        <h2 className="text-xl font-bold text-[#222] mb-8">Inside the Hall</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <PhotoBox key={n} label={`[ Photo ${n} ]`} className="h-52" />
          ))}
        </div>
      </SWrap>

      {/* Testimonials */}
      <SWrap bg="bg-white border-y border-[#D1D1D1]">
        <SLabel>Testimonials</SLabel>
        <h2 className="text-xl font-bold text-[#222] mb-10 max-w-2xl">
          Proven Reliability for Large-Scale Events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(([quote, name, role]) => (
            <div
              key={name}
              className="border border-[#D1D1D1] bg-white p-6 flex flex-col gap-4"
            >
              <p className="text-sm text-[#444] leading-relaxed">
                &ldquo;{quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-auto pt-2 border-t border-[#EBEBEB]">
                <IconBox className="w-9 h-9 rounded-full" />
                <div>
                  <p className="text-sm font-bold text-[#222]">{name}</p>
                  <p className="text-xs text-[#888]">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SWrap>

      {/* Trusted By */}
      <SWrap>
        <SLabel>Trusted By</SLabel>
        <h2 className="text-xl font-bold text-[#222] mb-6">
          Organizations Who Chose SCC
        </h2>
        <div className="flex flex-wrap gap-4">
          <div className="border border-[#D1D1D1] bg-white px-6 py-4 flex items-center gap-3">
            <Image
              src="/gkdi-tgr-logo.png"
              alt="GKDI Tangerang"
              width={24}
              height={24}
              className="object-contain flex-shrink-0"
            />
            <span className="text-xs font-semibold text-[#555] uppercase tracking-wide">
              GKDI Tangerang
            </span>
          </div>
        </div>
      </SWrap>

      {/* Location */}
      <SWrap bg="bg-white border-b border-[#D1D1D1]">
        <SLabel>Our Location</SLabel>
        <h2 className="text-xl font-bold text-[#222] mb-10">Access & Directions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <iframe
            src={VENUE_MAPS_EMBED_URL}
            className="w-full h-72 border border-[#D1D1D1]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="SCC Venue Location"
          />
          <div className="flex flex-col gap-8">
            <div>
              <SLabel>Venue Address</SLabel>
              <a
                href={VENUE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#333] leading-relaxed hover:underline block max-w-md"
              >
                Jl. MH. Thamrin No.KM 2 Lt P5, RT.007/RW.001, Panunggangan
                Utara, Kec. Pinang, Kota Tangerang, Banten 15143
              </a>
            </div>
            <div>
              <SLabel>Getting Here</SLabel>
              <ul className="flex flex-col gap-3 mt-2">
                {GETTING_HERE.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <IconBox className="w-3 h-3 mt-1" />
                    <span className="text-sm text-[#555] leading-relaxed">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <a href={VENUE_MAPS_URL} target="_blank" rel="noopener noreferrer">
              <Btn>Get Directions</Btn>
            </a>
          </div>
        </div>
      </SWrap>

      <Footer />
    </div>
  );
}
