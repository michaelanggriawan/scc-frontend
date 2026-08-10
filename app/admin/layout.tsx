"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PhotoBox, Spinner } from "@/components/ui";

const NAV = [
  ["Dashboard", "/admin"],
  ["Inquiries", "/admin/inquiries"],
  ["Rooms", "/admin/rooms"],
  ["Add-ons", "/admin/addons"],
  ["Settings", "/admin/settings"],
];

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
    return <Spinner label="Checking admin access…" />;

  return (
    <div className="bg-[#F0F0F0] min-h-screen flex">
      <aside className="w-56 bg-[#222] flex-shrink-0 flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <PhotoBox label="[ SCC Admin ]" className="h-8 w-full" />
        </div>
        <nav className="flex-1 flex flex-col py-4">
          {NAV.map(([label, href]) => {
            const active =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-5 py-3 text-sm ${
                  active
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-5 border-t border-white/10 flex flex-col gap-2">
          <Link href="/" className="text-xs text-white/50 hover:text-white/80">
            ← Public site
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="text-xs text-white/50 hover:text-white/80 text-left cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-auto">{children}</main>
    </div>
  );
}
