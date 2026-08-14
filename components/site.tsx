'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { VenueInfo } from '@/lib/types';
import { Btn, Icon } from './ui';

const NAV_LINKS = [
  ['Home', '/'],
  ['Venue', '/venue'],
  ['Booking', '/booking'],
] as const;

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative h-20 bg-white/95 backdrop-blur border-b border-mahogany/10 flex items-center justify-between px-6 md:px-16 gap-8 sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-3 flex-shrink-0">
        <Image src="/logo-hd.png" alt="SCC Serpong" width={168} height={112} className="h-12 w-auto object-contain" priority />
      </Link>
      <div className="hidden md:flex items-center gap-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {NAV_LINKS.map(([label, href]) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`relative text-base tracking-wide py-1 transition-colors ${
                active ? 'text-mahogany' : 'text-ink/65 hover:text-ink'
              }`}
            >
              {label}
              {active && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gold" />
              )}
            </Link>
          );
        })}
      </div>
      <div className="hidden md:flex items-center gap-3 flex-shrink-0">
        {user ? (
          <>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="text-xs font-semibold text-mahogany hover:text-cherry tracking-wide"
              >
                Admin
              </Link>
            )}
            <Link
              href="/profile"
              className="flex items-center gap-2 border border-mahogany/20 bg-transparent px-3.5 py-2 text-xs font-semibold text-ink hover:border-gold transition-colors"
            >
              <Icon name="user" className="w-4 h-4 text-gold-dim" />
              {user.fullName || user.email}
            </Link>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="text-xs text-ink/50 hover:text-mahogany cursor-pointer transition-colors"
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
      <button
        className="md:hidden ml-auto text-mahogany"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        <Icon name={open ? 'close' : 'menu'} className="w-6 h-6" />
      </button>

      {open && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-mahogany/10 flex flex-col px-6 py-6 gap-5 z-40 shadow-lg">
          {NAV_LINKS.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className={`text-sm ${pathname === href ? 'text-mahogany font-semibold' : 'text-ink/75'}`}
            >
              {label}
            </Link>
          ))}
          <div className="h-px bg-mahogany/10" />
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link href="/admin" onClick={() => setOpen(false)} className="text-sm text-mahogany">
                  Admin
                </Link>
              )}
              <Link href="/profile" onClick={() => setOpen(false)} className="text-sm text-ink/75">
                {user.fullName || user.email}
              </Link>
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                  router.push('/');
                }}
                className="text-sm text-left text-ink/50"
              >
                Log out
              </button>
            </>
          ) : (
            <Btn sm onClick={() => { setOpen(false); router.push('/login'); }}>
              Login
            </Btn>
          )}
        </div>
      )}
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
      className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 group ${
        href ? '' : 'pointer-events-none opacity-50'
      }`}
    >
      <div className="bg-mahogany border border-gold-dim/60 px-3 py-1.5 text-xs text-custard shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
        Chat with us on WhatsApp
      </div>
      <div className="w-16 h-16 cursor-pointer rounded-full bg-[linear-gradient(155deg,var(--color-gold-light),var(--color-gold))] p-3 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.5)] transition-transform hover:scale-105">
        <Image
          src="/WhatsApp.webp"
          alt="Chat with us on WhatsApp"
          width={48}
          height={48}
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

  const socials = [
    ['instagram', venue?.instagram],
    ['youtube', venue?.youtube],
  ] as const;

  return (
    <footer className="scc-dark relative bg-mahogany-2 border-t border-[var(--surface-border)] px-6 md:px-16 pt-16 pb-8 overflow-hidden">
      <div className="grain-overlay" />
      <div className="relative max-w-screen-xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Image src="/logo-hd.png" alt="SCC Serpong" width={168} height={112} className="h-10 w-auto object-contain" />
            <p className="text-xs text-custard/50 mt-3 leading-relaxed max-w-xs">
              A column-free convention hall in the heart of Tangerang, built for
              events that deserve full attention.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gold uppercase tracking-[0.2em] mb-4">
              Contact
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-custard/70">
              {venue?.address ? (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(venue.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 hover:text-gold transition-colors"
                >
                  <Icon name="mapPin" className="w-4 h-4 mt-0.5 text-gold-dim flex-shrink-0" />
                  {venue.address}
                </a>
              ) : (
                <span className="flex items-start gap-2">
                  <Icon name="mapPin" className="w-4 h-4 mt-0.5 text-gold-dim flex-shrink-0" />
                  {venue?.name || 'SCC Venue'}
                </span>
              )}
              {venue?.phone ? (
                <a
                  href={`tel:${venue.phone}`}
                  className="flex items-center gap-2 hover:text-gold transition-colors"
                >
                  <Icon name="phone" className="w-4 h-4 text-gold-dim flex-shrink-0" />
                  {venue.phone}
                </a>
              ) : (
                <span className="flex items-center gap-2">
                  <Icon name="phone" className="w-4 h-4 text-gold-dim flex-shrink-0" />
                  —
                </span>
              )}
              {venue?.email ? (
                <a
                  href={`mailto:${venue.email}`}
                  className="flex items-center gap-2 hover:text-gold transition-colors"
                >
                  <Icon name="mail" className="w-4 h-4 text-gold-dim flex-shrink-0" />
                  {venue.email}
                </a>
              ) : (
                <span className="flex items-center gap-2">
                  <Icon name="mail" className="w-4 h-4 text-gold-dim flex-shrink-0" />
                  —
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gold uppercase tracking-[0.2em] mb-4">
              Quick Links
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-custard/70">
              <Link href="/" className="hover:text-gold transition-colors">
                Home
              </Link>
              <Link href="/venue" className="hover:text-gold transition-colors">
                Venue Detail
              </Link>
              <Link href="/booking" className="hover:text-gold transition-colors">
                Booking
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gold uppercase tracking-[0.2em] mb-4">
              Follow Us
            </p>
            <div className="flex items-center gap-3">
              {socials.map(([name, url]) =>
                url ? (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center border border-[var(--surface-border-strong)] text-gold-dim hover:text-gold hover:border-gold transition-colors"
                  >
                    <Icon name={name} className="w-4 h-4" />
                  </a>
                ) : null,
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--surface-border)] pt-6 text-xs text-custard/40">
          © {new Date().getFullYear()} Serpong Convention Center. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
