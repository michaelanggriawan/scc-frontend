'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { VenueInfo } from '@/lib/types';
import { Btn, IconBox, PhotoBox } from './ui';

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="h-16 bg-white border-b border-[#D1D1D1] flex items-center px-6 md:px-16 gap-8 sticky top-0 z-40">
      <Link href="/">
        <PhotoBox label="[ SCC ]" className="w-28 h-8" />
      </Link>
      <div className="flex-1 flex justify-center gap-6 md:gap-10">
        {[
          ['Home', '/'],
          ['Venue', '/venue'],
          ['Booking', '/booking'],
        ].map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="text-sm text-[#333] hover:text-black"
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="text-xs font-semibold text-[#555] underline"
              >
                Admin
              </Link>
            )}
            <Link
              href="/profile"
              className="flex items-center gap-2 border border-[#D1D1D1] bg-white px-3 py-1.5 text-xs font-semibold text-[#333]"
            >
              <IconBox className="w-5 h-5" />
              {user.fullName || user.email}
            </Link>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="text-xs text-[#888] underline cursor-pointer"
            >
              Log out
            </button>
          </>
        ) : (
          <Btn sm onClick={() => router.push('/login')}>
            Login
          </Btn>
        )}
      </div>
    </nav>
  );
}

const WA_DEFAULT_MESSAGE =
  'Halo, saya ingin tanya soal Serpong Convention Center.';

// Normalizes a local/intl-formatted phone number into the digits-only,
// country-code-prefixed form wa.me expects (e.g. "0811..." -> "62811...").
function toWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}

export function FloatingWA() {
  const [venue, setVenue] = useState<VenueInfo | null>(null);
  useEffect(() => {
    api.get<VenueInfo>('/public/venue-info').then(setVenue).catch(() => {});
  }, []);

  const phone = venue?.whatsapp ? toWaNumber(venue.whatsapp) : '';
  const href = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(WA_DEFAULT_MESSAGE)}`
    : undefined;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!href}
      className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 ${
        href ? '' : 'pointer-events-none opacity-50'
      }`}
    >
      <div className="bg-white border border-[#D1D1D1] px-3 py-1.5 text-xs text-[#555] shadow-sm">
        Chat with us on WhatsApp
      </div>
      <div className="w-14 h-14 cursor-pointer">
        <Image
          src="/WhatsApp.webp"
          alt="Chat with us on WhatsApp"
          width={56}
          height={56}
          className="w-full h-full object-contain"
        />
      </div>
    </a>
  );
}

export function Footer() {
  const [venue, setVenue] = useState<VenueInfo | null>(null);
  useEffect(() => {
    api.get<VenueInfo>('/public/venue-info').then(setVenue).catch(() => {});
  }, []);

  return (
    <footer className="bg-[#2B2B2B] px-6 md:px-16 py-12">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          <div>
            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-widest mb-4">
              Contact Info
            </p>
            <div className="flex flex-col gap-2 text-sm text-[#BBBBBB]">
              <span>{venue?.name || 'SCC Venue'}</span>
              <span>{venue?.address || '—'}</span>
              <span>{venue?.phone || '—'}</span>
              <span>{venue?.email || '—'}</span>
              {venue?.whatsapp && (
                <span className="text-xs text-[#888]">
                  WhatsApp: {venue.whatsapp}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-widest mb-4">
              Quick Links
            </p>
            <div className="flex flex-col gap-2 text-sm text-[#BBBBBB]">
              <Link href="/" className="hover:text-white">
                Home
              </Link>
              <Link href="/venue" className="hover:text-white">
                Venue Detail
              </Link>
              <Link href="/booking" className="hover:text-white">
                Booking
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-widest mb-4">
              Follow Us
            </p>
            <div className="flex flex-col gap-2 text-sm text-[#BBBBBB]">
              <span>{venue?.instagram || 'Instagram'}</span>
              <span>{venue?.facebook || 'Facebook'}</span>
              <span>{venue?.linkedin || 'LinkedIn'}</span>
              <span>{venue?.youtube || 'YouTube'}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-widest mb-4">
              Resources
            </p>
            <span className="text-sm text-[#BBBBBB]">
              Venue Floorplan &amp; Tech Specs (PDF)
            </span>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-xs text-[#777]">
          © {new Date().getFullYear()} SCC Venue. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
