"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function AdminRouteGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (user?.role === "admin" && !pathname.startsWith("/admin")) {
      router.replace("/admin");
    }
  }, [loading, user, pathname, router]);

  return null;
}
