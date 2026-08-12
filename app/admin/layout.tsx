"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Icon, Spinner } from "@/components/ui";

const NAV = [
  ["Dashboard", "/admin", "screen"],
  ["Inquiries", "/admin/inquiries", "fileText"],
  ["Rooms", "/admin/rooms", "building"],
  ["Add-ons", "/admin/addons", "plus"],
  ["Settings", "/admin/settings", "spark"],
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/login");
  }, [loading, user, router]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (loading || !user || user.role !== "admin")
    return (
      <div className="bg-mahogany-2 min-h-screen">
        <Spinner label="Checking admin access…" />
      </div>
    );

  const sidebarContent = (
    <>
      <div className="px-6 py-6 border-b border-custard/10 flex items-center justify-between">
        <span className="flex flex-col leading-none">
          <span className="font-display text-2xl italic text-custard">SCC</span>
          <span className="text-[8px] tracking-[0.28em] uppercase text-gold-dim mt-1">
            Admin Panel
          </span>
        </span>
        <button
          onClick={() => setNavOpen(false)}
          aria-label="Close menu"
          className="lg:hidden text-custard/60 hover:text-gold transition-colors"
        >
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 flex flex-col py-5 gap-1">
        {NAV.map(([label, href, icon]) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setNavOpen(false)}
              className={`relative flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                active
                  ? "text-gold font-semibold bg-custard/5"
                  : "text-custard/55 hover:text-custard/85"
              }`}
            >
              {active && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold" />}
              <Icon name={icon} className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-6 border-t border-custard/10 flex flex-col gap-3">
        <Link
          href="/"
          onClick={() => setNavOpen(false)}
          className="flex items-center gap-2 text-xs text-custard/45 hover:text-gold transition-colors"
        >
          <Icon name="arrowLeft" className="w-3.5 h-3.5" />
          Public site
        </Link>
        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="flex items-center gap-2 text-xs text-custard/45 hover:text-gold text-left cursor-pointer transition-colors"
        >
          <Icon name="logout" className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <div className="scc-light bg-cream min-h-screen flex text-ink">
      {/* Mobile top bar — hidden at lg+, where the persistent sidebar takes over. */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-mahogany-2 flex items-center justify-between px-4 border-b border-custard/10">
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          aria-expanded={navOpen}
          className="text-custard/70 hover:text-gold transition-colors"
        >
          <Icon name="menu" className="w-6 h-6" />
        </button>
        <span className="flex items-baseline gap-1.5 leading-none">
          <span className="font-display text-lg italic text-custard">SCC</span>
          <span className="text-[8px] tracking-[0.2em] uppercase text-gold-dim">
            Admin Panel
          </span>
        </span>
        <span className="w-6" aria-hidden="true" />
      </div>

      {/* Backdrop for the mobile drawer. */}
      {navOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: persistent on lg+, off-canvas drawer below lg. */}
      <aside
        className={`w-60 bg-mahogany-2 flex-shrink-0 flex flex-col fixed lg:sticky top-0 h-screen z-50 transition-transform duration-200 ease-out ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {sidebarContent}
      </aside>

      <main className="flex-1 flex flex-col overflow-auto pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
