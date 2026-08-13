"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, Btn, Icon, Spinner } from "@/components/ui";
import { api, ApiError, fileUrl, rupiah } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDueDate } from "@/lib/datetime";
import { isValidUploadSize, MAX_UPLOAD_MB } from "@/lib/validation";
import type { PayPageData } from "@/lib/types";

export default function PayPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [data, setData] = useState<PayPageData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [wrongAccount, setWrongAccount] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const loginHref = `/login?next=${encodeURIComponent(`/pay/${token}`)}`;

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setData(await api.get<PayPageData>(`/pay/${token}`));
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setWrongAccount(true);
      } else {
        setNotFound(true);
      }
    }
  }, [token, user]);

  useEffect(() => {
    load();
  }, [load]);

  if (authLoading) return <Spinner label="Loading payment page…" />;

  if (!user)
    return (
      <Centered>
        <Icon name="shield" className="w-8 h-8 text-gold-dim mx-auto" />
        <h1 className="font-display text-2xl text-ink">Please log in</h1>
        <p className="text-sm text-ink/55">
          This payment link is tied to a specific account. Log in with the
          account this booking belongs to, to continue.
        </p>
        <Btn onClick={() => router.push(loginHref)}>Log In</Btn>
      </Centered>
    );

  if (wrongAccount)
    return (
      <Centered>
        <Icon name="alert" className="w-8 h-8 text-danger mx-auto" />
        <h1 className="font-display text-2xl text-ink">Wrong account</h1>
        <p className="text-sm text-ink/55">
          This payment link belongs to a different account. Log out and log
          back in with the account this booking was made under.
        </p>
        <Btn
          onClick={() => {
            logout();
            router.push(loginHref);
          }}
        >
          Log Out &amp; Switch Account
        </Btn>
      </Centered>
    );

  async function submit() {
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      await api.upload(`/pay/${token}/proof`, file);
      setDone(true);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  if (notFound)
    return (
      <Centered>
        <Icon name="alert" className="w-8 h-8 text-danger mx-auto" />
        <h1 className="font-display text-2xl text-ink">Link not valid</h1>
        <p className="text-sm text-ink/55">
          This payment link is invalid, expired, or already used. Please contact
          us or check your bookings.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-mahogany hover:text-cherry transition-colors duration-150"
        >
          <Icon name="arrowLeft" className="w-3.5 h-3.5" />
          Back to site
        </Link>
      </Centered>
    );

  if (!data) return <Spinner label="Loading payment page…" />;

  if (done)
    return (
      <Centered>
        <Icon name="checkCircle" className="w-9 h-9 text-gold-dim mx-auto" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-dim">
          Payment submitted
        </p>
        <h1 className="font-display text-2xl italic text-ink">Thank you</h1>
        <p className="text-sm text-ink/55">
          We&apos;ve received your proof of payment for{" "}
          <span className="font-display text-lg text-mahogany not-italic">{data.ref}</span>.
          Our team will verify and confirm shortly.
        </p>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-xs text-mahogany hover:text-cherry transition-colors duration-150"
        >
          <Icon name="arrowLeft" className="w-3.5 h-3.5" />
          Back to my bookings
        </Link>
      </Centered>
    );

  return (
    <div className="min-h-screen bg-white py-16 px-6">
      <div className="grain-overlay" />
      <div className="relative max-w-xl mx-auto flex flex-col gap-6">
        <div className="text-center">
          <Icon name="creditCard" className="w-8 h-8 text-gold-dim mx-auto mb-4" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-dim mb-2">
            Serpong Convention Center
          </p>
          <h1 className="font-display text-3xl italic text-ink">
            Complete your payment
          </h1>
          <p className="text-sm text-ink/50 mt-1">Booking {data.ref}</p>
        </div>

        <div className="relative border border-gold-dim/50 bg-[var(--surface)] p-7 flex flex-col gap-5">
          <span className="absolute top-0 left-10 right-10 h-px bg-[linear-gradient(90deg,transparent,var(--color-gold),transparent)]" />

          <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-4">
            <span className="text-sm text-ink/60">Amount due</span>
            <span className="font-display text-2xl text-mahogany">
              {rupiah(data.amount)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink/50">Room</span>
            <span className="text-ink/85">{data.room?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink/50">Due by</span>
            <span className="text-ink/85">{formatDueDate(data.dueDate)}</span>
          </div>

          <div className="border border-[var(--surface-border)] bg-cream px-5 py-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gold-dim uppercase tracking-wide mb-3">
              <Icon name="creditCard" className="w-3.5 h-3.5" />
              Transfer to
            </p>
            <p className="text-sm font-semibold text-ink">
              {data.paymentInfo.bankName}
            </p>
            <p className="text-sm text-ink/80">
              {data.paymentInfo.accountNumber}
            </p>
            <p className="text-xs text-ink/50 mt-0.5">
              a/n {data.paymentInfo.accountName}
            </p>
            {data.paymentInfo.qrImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fileUrl(data.paymentInfo.qrImageUrl)}
                alt="Payment QR"
                className="w-40 h-40 object-contain mt-4 border border-[var(--surface-border)] bg-white p-2"
              />
            )}
            {data.paymentInfo.instructions && (
              <p className="text-[11px] text-ink/50 mt-3 leading-relaxed">
                {data.paymentInfo.instructions}
              </p>
            )}
          </div>

          {!data.payable ? (
            <Alert kind="info">
              This booking is currently &quot;{data.status}&quot; — no payment is
              expected right now.
            </Alert>
          ) : (
            <>
              <label className="border border-dashed border-[var(--surface-border-strong)] p-6 flex flex-col items-center gap-1.5 cursor-pointer transition-colors duration-150 hover:border-gold">
                <Icon name="upload" className="w-6 h-6 text-gold-dim" />
                <span className="text-xs text-ink/70">
                  {file ? file.name : "Upload proof of payment"}
                </span>
                <span className="text-[10px] text-ink/40">
                  JPG, PNG or PDF · Max {MAX_UPLOAD_MB} MB
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && !isValidUploadSize(f)) {
                      setErr(`File must be ${MAX_UPLOAD_MB} MB or smaller.`);
                      setFile(null);
                      return;
                    }
                    setErr("");
                    setFile(f);
                  }}
                />
              </label>
              {err && <Alert>{err}</Alert>}
              <Btn full disabled={!file || busy} onClick={submit}>
                {busy ? "Submitting…" : "Submit payment"}
              </Btn>
            </>
          )}
        </div>
        <p className="flex items-center justify-center gap-1.5 text-[10px] text-ink/40 text-center">
          <Icon name="info" className="w-3 h-3 flex-shrink-0" />
          If payment isn&apos;t received by the due date, this booking is
          automatically cancelled.
        </p>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md text-center flex flex-col items-center gap-3">{children}</div>
    </div>
  );
}
