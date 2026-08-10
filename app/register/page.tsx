"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/site";
import { Alert, Btn, TextField } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
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
    setBusy(true);
    try {
      await register(form);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
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
          className="w-[460px] max-w-full border border-[#D1D1D1] bg-white p-10 flex flex-col gap-5"
        >
          <div>
            <h1 className="text-xl font-bold text-[#222] mb-1">Create Account</h1>
            <p className="text-sm text-[#666]">
              Register to submit and track your bookings.
            </p>
          </div>
          <TextField label="Full Name" value={form.fullName} onChange={set("fullName")} required />
          <TextField label="Email Address" type="email" value={form.email} onChange={set("email")} required />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Phone" value={form.phone} onChange={set("phone")} />
            <TextField label="Company" value={form.company} onChange={set("company")} />
          </div>
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={set("password")}
            required
            minLength={8}
          />
          {error && <Alert>{error}</Alert>}
          <Btn full type="submit" disabled={busy}>
            {busy ? "Creating…" : "Sign Up"}
          </Btn>
          <p className="text-xs text-center text-[#666]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#222] underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
