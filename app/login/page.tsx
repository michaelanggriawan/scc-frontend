"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { NavBar } from "@/components/site";
import { Alert, Btn, Icon, TextField } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
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
      router.push(next || (user.role === "admin" ? "/admin" : "/"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white min-h-screen">
      <NavBar />
      <main id="main" className="flex min-h-[calc(100vh-80px)]">
        <div className="hidden lg:block relative w-[42%] flex-shrink-0">
          <Image
            src="https://picsum.photos/seed/scc-auth/900/1400"
            alt=""
            fill
            sizes="42vw"
            className="object-cover [filter:sepia(0.45)_saturate(1.5)_hue-rotate(-28deg)_brightness(0.5)_contrast(1.05)]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(42,2,1,0.3)_0%,rgba(42,2,1,0.92)_100%)]" />
          <div className="grain-overlay" />
          <div className="relative h-full flex flex-col justify-end p-14">
            <Icon name="spark" className="w-7 h-7 text-gold mb-5" />
            <p className="font-display italic text-2xl text-custard leading-snug text-balance">
              &ldquo;A column-free hall where every event finds its stage.&rdquo;
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-16">
          <form
            onSubmit={submit}
            className="w-[420px] max-w-full border border-[var(--surface-border)] bg-[var(--surface)] p-10 flex flex-col gap-6 relative"
          >
            <span className="absolute top-0 left-10 right-10 h-px bg-[linear-gradient(90deg,transparent,var(--color-gold),transparent)]" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-dim mb-3">
                Welcome Back
              </p>
              <h1 className="font-display text-3xl text-ink mb-2">Log In</h1>
              <p className="text-sm text-ink/55">
                {next === "/booking"
                  ? "Log in to submit your inquiry — your form details are saved and will be filled in when you come back."
                  : "Access your bookings and payment tracking."}
              </p>
            </div>
            <TextField
              label="Email Address"
              type="email"
              placeholder="e.g. jane@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <Alert>{error}</Alert>}
            <Btn full type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Log In"}
            </Btn>
            <p className="text-xs text-center text-ink/50">
              Don&apos;t have an account?{" "}
              <Link
                href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
                className="font-semibold text-mahogany hover:text-cherry"
              >
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
