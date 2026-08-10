"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/site";
import { Alert, Btn, TextField } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password);
      router.push(user.role === "admin" ? "/admin" : "/profile");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-[#F0F0F0] min-h-screen">
      <NavBar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-8 py-16">
        <form
          onSubmit={submit}
          className="w-[420px] max-w-full border border-[#D1D1D1] bg-white p-10 flex flex-col gap-5"
        >
          <div>
            <h1 className="text-xl font-bold text-[#222] mb-1">Log In</h1>
            <p className="text-sm text-[#666]">
              Access your bookings and payment tracking.
            </p>
          </div>
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <Alert>{error}</Alert>}
          <Btn full type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Log In"}
          </Btn>
          <p className="text-xs text-center text-[#666]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-[#222] underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
