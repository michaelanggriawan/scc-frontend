"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { NavBar } from "@/components/site";
import { Alert, Btn, Icon, TextField } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { isValidEmail, isValidPhone, validatePassword } from "@/lib/validation";

function RegisterContent() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(form.email)) {
      setError("Please provide a valid email address.");
      return;
    }
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      setError("Please provide a valid phone number.");
      return;
    }
    const passwordError = validatePassword(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setBusy(true);
    try {
      await register(form);
      router.push(next || "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
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
            src="https://picsum.photos/seed/scc-auth-2/900/1400"
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
              &ldquo;From consultation to curtain call, one team sees it through.&rdquo;
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-16">
          <form
            onSubmit={submit}
            className="w-[460px] max-w-full border border-[var(--surface-border)] bg-[var(--surface)] p-10 flex flex-col gap-5 relative"
          >
            <span className="absolute top-0 left-10 right-10 h-px bg-[linear-gradient(90deg,transparent,var(--color-gold),transparent)]" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-dim mb-3">
                Join SCC
              </p>
              <h1 className="font-display text-3xl text-ink mb-2">Create Account</h1>
              <p className="text-sm text-ink/55">
                {next === "/booking"
                  ? "Sign up to submit your inquiry — your form details are saved and will be filled in when you come back."
                  : "Register to submit and track your bookings."}
              </p>
            </div>
            <TextField
              label="Full Name"
              placeholder="e.g. Jane Doe"
              value={form.fullName}
              onChange={set("fullName")}
              required
            />
            <TextField
              label="Email Address"
              type="email"
              placeholder="e.g. jane@email.com"
              value={form.email}
              onChange={set("email")}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Phone"
                type="tel"
                placeholder="e.g. 0812 3456 7890"
                value={form.phone}
                onChange={set("phone")}
              />
              <TextField
                label="Company"
                placeholder="e.g. PT Acme Indonesia"
                value={form.company}
                onChange={set("company")}
              />
            </div>
            <TextField
              label="Password"
              type="password"
              placeholder="Min 8 chars, upper, lower, number & symbol"
              value={form.password}
              onChange={set("password")}
              required
              minLength={8}
            />
            {error && <Alert>{error}</Alert>}
            <Btn full type="submit" disabled={busy}>
              {busy ? "Creating…" : "Sign Up"}
            </Btn>
            <p className="text-xs text-center text-ink/50">
              Already have an account?{" "}
              <Link
                href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
                className="font-semibold text-mahogany hover:text-cherry"
              >
                Log In
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

// useSearchParams() forces a client bailout that must sit under a Suspense
// boundary, or the static build of /register fails.
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
