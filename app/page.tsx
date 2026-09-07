"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer, FloatingWA } from "@/components/site";
import { AdminRedirectGuard } from "@/components/admin-redirect-guard";
import {
  AnimatedStat,
  Btn,
  Icon,
  Reveal,
  SLabel,
  SWrap,
} from "@/components/ui";
import { api, fileUrl } from "@/lib/api";
import type { GalleryInfo, GalleryPhoto } from "@/lib/types";

const VENUE_MAPS_URL =
  "https://maps.google.com/?cid=15856071987079643264&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ";
const VENUE_MAPS_EMBED_URL = "https://maps.google.com/maps?cid=15856071987079643264&output=embed";

const STATS = [
  ["1008 m²", "Pillar-Free Main Hall"],
  ["1000+", "Maximum Guest Capacity"],
  ["14m × 8m", "High-Capacity Structural Stage"],
  ["300", "Spacious Parking Area"],
] as const;

const EVENT_TYPES = [
  [
    "mic",
    "Conference",
    "Pillar-free visibility and high-performance acoustic treatment for optimal delegate engagement.",
  ],
  [
    "building",
    "Exhibition & Expo",
    "A spacious area equipped with modular under-floor utilities (trenches) for clean and organized electrical and water access.",
  ],
  [
    "shield",
    "Corporate Summit",
    "Exclusive VIP meeting suites with secure, high-speed fiber internet connection.",
  ],
  [
    "speaker",
    "Concerts & Live Performances",
    "Flexible stage area featuring private backstage green rooms for various performance scales.",
  ],
  [
    "spark",
    "House of Worship",
    "Precision-engineered room acoustics designed for speech clarity and full-band live music.",
  ],
  [
    "spotlight",
    "Product Launches",
    "A dynamic space tailored to create a stunning first impression, ideal for introducing your latest innovations and products to the public.",
  ],
] as const;

const PRODUCTION_SYSTEMS = [
  [
    "screen",
    "Visual & LED Systems",
    [
      "14m × 3m P2.5 indoor LED wall for razor-sharp visuals",
      "Novastar VX1000 professional video processor with integrated HDMI input",
      "Dedicated media server (Intel Core i7-14700, NVIDIA GeForce RTX 5070 Ti) for lag-free video mapping",
      "Delivery, installation, signal cabling, and a standby technician included for the full event",
    ],
  ],
  [
    "speaker",
    "Audio Systems",
    [
      "Behringer Wing digital ecosystem as the central control system",
      "ZSOUND LA210 line array & S218B subwoofers for crystal-clear vocals and precise bass",
      "Scales from 300-pax ballroom packages up to full concert rigs for 500–1,000+ pax",
    ],
  ],
  [
    "spotlight",
    "Stage Lighting",
    [
      "LED Par (color wash) and Fresnel face lighting for meetings up to 100 pax",
      "Moving head beams and a hazer machine for atmospheric corporate events up to 250 pax",
      "Full controller console system operated by a dedicated lighting crew",
    ],
  ],
] as const;

const REASONS = [
  [
    "plug",
    "Built-in Production",
    "Cut down massive external vendor expenses. High-resolution P2.5 LED screens and concert-grade sound systems are already integrated directly as standard built-in facilities.",
  ],
  [
    "building",
    "1,008 m² Pillarless Space",
    "A spacious 42 x 24 meter layout with zero obstructing columns, maximizing seating capacity and ensuring a crystal-clear, unobstructed view for every attendee.",
  ],
  [
    "handshake",
    "Smart Investment & Maximum Cost-Efficiency",
    "Gain professional-grade convention facilities with a much more rational financial structure—securing your event's profit margins without ever compromising on quality.",
  ],
] as const;

const STEPS = [
  ["01", "Consultation", "Reach out to share requirements, preferred dates, and technical demands."],
  ["02", "Site Visit", "Walk the hall, test viewing angles, inspect loading logistics."],
  ["03", "Proposal", "Receive a tailored plan and a clear cost breakdown."],
  ["04", "Event Day", "Watch your vision unfold, guided by our support staff."],
] as const;

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
] as const;

const GETTING_HERE = [
  "5 minutes from the Jakarta–Serpong Toll Exit",
  "40 minutes via toll road to Soekarno–Hatta International Airport (Bandar Udara Internasional Soekarno–Hatta)",
  "Parking area for 300+ vehicles with a dedicated loading/unloading zone.",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const FALLBACK_GALLERY_SEEDS = ["main-hall", "stage-rig", "led-wall", "vip-lounge"];

export default function HomePage() {
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<GalleryInfo>("/public/gallery")
      .then((res) => setGalleryPhotos(res.photos))
      .catch(() => setGalleryPhotos([]));
  }, []);

  const galleryImages =
    galleryPhotos && galleryPhotos.length > 0
      ? galleryPhotos.map((photo) => ({
          key: photo.id,
          src: fileUrl(photo.url),
          posX: photo.posX,
          posY: photo.posY,
        }))
      : FALLBACK_GALLERY_SEEDS.map((seed) => ({
          key: seed,
          src: `https://picsum.photos/seed/scc-${seed}/640/640`,
          posX: 50,
          posY: 50,
        }));

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i === null ? i : (i + 1) % galleryImages.length));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) =>
          i === null ? i : (i - 1 + galleryImages.length) % galleryImages.length
        );
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, galleryImages.length]);

  return (
    <div className="bg-white min-h-screen">
      <AdminRedirectGuard />
      <FloatingWA />

      <main id="main">
        {/* Hero */}
        <section className="relative w-full h-[calc(100vh-5rem)] min-h-[640px] flex items-center">
          <Image
            src="/hero-2.png"
            alt="Serpong Convention Center — full pillar-free main hall"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_65%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,2,1,0.35)_0%,rgba(42,2,1,0.55)_55%,rgba(42,2,1,0.96)_100%)]" />
          <div className="grain-overlay" />
          <Reveal className="relative w-full max-w-screen-xl mx-auto px-6 md:px-16">
            <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.28em] text-gold-light mb-5">
              <span className="w-8 h-px bg-gold-light" />
              <span style={{ color: '#fff134', textShadow: '0 1px 8px rgba(231, 185, 63, 0.25)' }}>
                Serpong Convention Center
              </span>
            </p>
            <h1 className="font-display text-5xl md:text-7xl italic text-white leading-[1.05] mb-6 max-w-3xl text-balance">
              One Venue, Endless Possibilities
            </h1>
            <p className="text-base text-white/85 mb-2 max-w-xl leading-relaxed">
              A column-free convention venue designed for high-impact conferences,
              exhibitions, corporate summits, and large-scale live productions.
            </p>
            <p className="text-sm text-white/60 mb-10 max-w-xl">
              1,008 m² of versatile space right in the heart of Tangerang.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/booking">
                <Btn>Book Now</Btn>
              </Link>
              <Link href="/venue">
                <button className="inline-flex items-center justify-center gap-2 border border-white/50 bg-transparent text-white font-semibold tracking-[0.02em] px-7 py-3 text-sm cursor-pointer transition-all duration-200 hover:border-white hover:bg-white/10">
                  Plan a Visit
                </button>
              </Link>
            </div>
          </Reveal>
        </section>

        {/* Statistics — the one full-bleed red band on the page */}
        <SWrap bg="scc-dark bg-mahogany border-b border-[var(--surface-border)]" className="py-12 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(([stat, label], i) => (
              <Reveal
                key={label}
                delay={i * 90}
                className="flex flex-col items-center gap-2 text-center"
              >
                <AnimatedStat
                  value={stat}
                  className="font-display text-3xl md:text-4xl text-gold"
                />
                <p className="text-xs text-custard/55 tracking-wide">{label}</p>
              </Reveal>
            ))}
          </div>
        </SWrap>

        {/* Versatile Spaces */}
        <SWrap>
          <Reveal>
            <SLabel>Flexible Space</SLabel>
            <h2 className="font-display text-3xl md:text-4xl text-ink mb-10 max-w-xl text-balance">
              Custom Configurations for Every Event Format
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EVENT_TYPES.map(([icon, name, desc], i) => (
              <Reveal
                key={name}
                delay={(i % 3) * 90}
                className="group border border-mahogany/12 bg-white p-6 flex flex-col gap-4 transition-colors duration-200 hover:border-gold-dim"
              >
                <span className="w-11 h-11 flex items-center justify-center border border-gold-dim/50 text-gold-dim group-hover:bg-gold group-hover:text-mahogany-2 group-hover:border-gold transition-colors duration-200">
                  <Icon name={icon} className="w-5 h-5" />
                </span>
                <p className="font-display text-lg text-ink">{name}</p>
                <p className="text-sm text-ink/55 leading-relaxed">{desc}</p>
              </Reveal>
            ))}
          </div>
        </SWrap>

        {/* Why SCC */}
        <SWrap bg="bg-cream border-y border-mahogany/10">
          <Reveal>
            <SLabel>Why SCC</SLabel>
            <h2 className="font-display text-3xl md:text-4xl text-ink mb-14 max-w-xl text-balance">
              Smart Investment, Maximum Efficiency
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {REASONS.map(([icon, t, d], i) => (
              <Reveal key={t} delay={i * 110} className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <Icon name={icon} className="w-6 h-6 text-mahogany" />
                </div>
                <p className="text-base font-semibold text-ink">{t}</p>
                <p className="text-sm text-ink/55 leading-relaxed">{d}</p>
              </Reveal>
            ))}
          </div>
        </SWrap>

        {/* Production Systems */}
        <SWrap>
          <Reveal>
            <SLabel>Production Systems</SLabel>
            <h2 className="font-display text-3xl md:text-4xl text-ink mb-14 max-w-xl text-balance">
              Built-In Visual, Audio &amp; Lighting Infrastructure
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {PRODUCTION_SYSTEMS.map(([icon, title, points], i) => (
              <Reveal key={title} delay={i * 110} className="flex flex-col gap-4">
                <span className="w-11 h-11 flex items-center justify-center border border-gold-dim/50 text-gold-dim">
                  <Icon name={icon} className="w-5 h-5" />
                </span>
                <p className="text-base font-semibold text-ink">{title}</p>
                <ul className="flex flex-col gap-2.5">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <span className="w-1 h-1 mt-2 flex-shrink-0 bg-gold rotate-45" />
                      <span className="text-sm text-ink/55 leading-relaxed">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </SWrap>

        {/* Process */}
        <SWrap bg="bg-cream border-y border-mahogany/10">
          <Reveal>
            <SLabel>How It Works</SLabel>
            <h2 className="font-display text-3xl md:text-4xl text-ink mb-14 text-balance">
              The Booking Process
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-mahogany/12 bg-white">
            {STEPS.map(([step, title, body], i) => (
              <Reveal
                key={step}
                delay={i * 100}
                className={`p-7 flex flex-col gap-3 ${
                  i < 3 ? "md:border-r border-mahogany/12" : ""
                }`}
              >
                <p className="font-display text-4xl text-gold-dim">{step}</p>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="text-xs text-ink/50 leading-relaxed">{body}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/booking">
              <Btn>Submit an Inquiry</Btn>
            </Link>
          </div>
        </SWrap>

        {/* Gallery */}
        <SWrap>
          <Reveal>
            <SLabel>Gallery</SLabel>
            <h2 className="font-display text-3xl md:text-4xl text-ink mb-10 text-balance">
              Inside the Hall
            </h2>
          </Reveal>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0">
            {galleryImages.map((img, i) => (
              <Reveal
                key={img.key}
                delay={i * 90}
                className="relative h-52 w-64 md:w-72 flex-shrink-0 overflow-hidden border border-mahogany/12 group snap-start"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="absolute inset-0 w-full h-full cursor-zoom-in"
                  aria-label="View full image"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt=""
                    style={{ objectPosition: `${img.posX}% ${img.posY}%` }}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-mahogany-2/10 group-hover:bg-mahogany-2/0 transition-colors" />
                </button>
              </Reveal>
            ))}
          </div>
        </SWrap>

        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center px-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close"
              className="absolute top-5 right-5 md:top-8 md:right-8 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center text-3xl leading-none"
            >
              &times;
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) =>
                  i === null ? i : (i - 1 + galleryImages.length) % galleryImages.length
                );
              }}
              aria-label="Previous image"
              className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-white/80 hover:text-white w-12 h-12 flex items-center justify-center text-4xl leading-none"
            >
              &#8249;
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={galleryImages[lightboxIndex].src}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[85vh] object-contain"
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i === null ? i : (i + 1) % galleryImages.length));
              }}
              aria-label="Next image"
              className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-white/80 hover:text-white w-12 h-12 flex items-center justify-center text-4xl leading-none"
            >
              &#8250;
            </button>
          </div>
        )}

        {/* Testimonials */}
        <SWrap bg="bg-cream border-y border-mahogany/10">
          <Reveal>
            <SLabel>Testimonials</SLabel>
            <h2 className="font-display text-3xl md:text-4xl text-ink mb-14 max-w-2xl text-balance">
              Proven Reliability for Large-Scale Events
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(([quote, name, role], i) => (
              <Reveal
                key={name}
                delay={i * 110}
                className="border border-mahogany/12 bg-white p-7 flex flex-col gap-6"
              >
                <Icon name="spark" className="w-5 h-5 text-gold-dim" />
                <p className="text-sm text-ink/70 leading-relaxed flex-1">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-5 border-t border-mahogany/10">
                  <span className="w-10 h-10 flex items-center justify-center rounded-full border border-gold-dim/50 text-mahogany font-display text-sm">
                    {initials(name)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{name}</p>
                    <p className="text-xs text-ink/50">{role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </SWrap>

        {/* Trusted By */}
        <SWrap>
          <Reveal>
            <SLabel>Trusted By</SLabel>
            <h2 className="font-display text-3xl md:text-4xl text-ink mb-8 text-balance">
              Organizations Who Chose SCC
            </h2>
            <div className="flex flex-wrap gap-4">
              <div className="border border-mahogany/12 bg-white px-6 py-4 flex items-center gap-3">
                <Image
                  src="/gkdi-tgr-logo.png"
                  alt="GKDI Tangerang"
                  width={24}
                  height={24}
                  className="object-contain flex-shrink-0"
                />
                <span className="text-xs font-semibold text-ink/70 uppercase tracking-wide">
                  GKDI Tangerang
                </span>
              </div>
            </div>
          </Reveal>
        </SWrap>

        {/* Location */}
        <SWrap bg="bg-cream border-b border-mahogany/10">
          <Reveal>
            <SLabel>Our Location</SLabel>
            <h2 className="font-display text-3xl md:text-4xl text-ink mb-14 text-balance">
              Access &amp; Directions
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            <Reveal className="relative border border-gold-dim/40 bg-white p-1.5 min-h-72">
              <iframe
                src={VENUE_MAPS_EMBED_URL}
                className="w-full h-full grayscale-[0.15] sepia-[0.12] contrast-[1.02]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="SCC Venue Location"
              />
            </Reveal>
            <Reveal delay={120} className="flex flex-col gap-8">
              <div>
                <SLabel>Venue Address</SLabel>
                <a
                  href={VENUE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-sm text-ink/70 leading-relaxed hover:text-mahogany transition-colors block max-w-md"
                >
                  <Icon name="mapPin" className="w-4 h-4 mt-0.5 text-gold-dim flex-shrink-0" />
                  Jl. MH. Thamrin No.KM 2 Lt P5, RT.007/RW.001, Panunggangan
                  Utara, Kec. Pinang, Kota Tangerang, Banten 15143
                </a>
              </div>
              <div>
                <SLabel>Getting Here</SLabel>
                <ul className="flex flex-col gap-3 mt-4">
                  {GETTING_HERE.map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <Icon name="car" className="w-4 h-4 mt-0.5 text-gold-dim flex-shrink-0" />
                      <span className="text-sm text-ink/65 leading-relaxed">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <a href={VENUE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="w-fit">
                <Btn>Get Directions</Btn>
              </a>
            </Reveal>
          </div>
        </SWrap>
      </main>

      <Footer />
    </div>
  );
}
