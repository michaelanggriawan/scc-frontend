"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user || user.role !== "admin")
    return (
      <div className="bg-mahogany-2 min-h-screen">
        <Spinner label="Checking admin access…" />
      </div>
    );

  return (
    <div className="scc-light bg-cream min-h-screen flex text-ink">
      <aside className="w-60 bg-mahogany-2 flex-shrink-0 flex flex-col sticky top-0 h-screen">
        <div className="px-6 py-6 border-b border-custard/10">
          <span className="flex flex-col leading-none">
            <span className="font-display text-2xl italic text-custard">SCC</span>
            <span className="text-[8px] tracking-[0.28em] uppercase text-gold-dim mt-1">
              Admin Panel
            </span>
          </span>
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
          <Link href="/" className="flex items-center gap-2 text-xs text-custard/45 hover:text-gold transition-colors">
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
      </aside>
      <main className="flex-1 flex flex-col overflow-auto">{children}</main>
    </div>
  );
}
