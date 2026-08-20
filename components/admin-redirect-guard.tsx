"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

// Renders nothing — sends logged-in admins to the admin dashboard when they
// land on a public page (home, venue, booking) instead of letting them view it.
export function AdminRedirectGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === "admin") router.replace("/admin");
  }, [loading, user, router]);

  return null;
}
