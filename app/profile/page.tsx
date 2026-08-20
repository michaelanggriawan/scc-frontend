"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Footer, FloatingWA } from "@/components/site";
import {
  Alert,
  Btn,
  Icon,
  OutlineBtn,
  PhotoBox,
  SLabel,
  Spinner,
  StatusBadge,
  TextField,
} from "@/components/ui";
import { api, ApiError, fileUrl, rupiah } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDueDate } from "@/lib/datetime";
import {
  isValidEmail,
  isValidPhone,
  isValidUploadSize,
  MAX_UPLOAD_MB,
  validatePassword,
} from "@/lib/validation";
import type { Inquiry, PayPageData } from "@/lib/types";

const CANCELLABLE = [
  "New Inquiry",
  "Awaiting Payment",
  "Payment Submitted",
  "Payment Rejected",
];

export default function ProfilePage() {
  return (
    <Suspense fallback={<Spinner label="Loading your profile…" />}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const { user, loading, refresh, justLoggedOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: "account" | "bookings" =
    searchParams.get("tab") === "bookings" ? "bookings" : "account";

  useEffect(() => {
    if (!loading && !user && !justLoggedOut()) {
      const next = tab === "bookings" ? "/profile?tab=bookings" : "/profile";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [loading, user, router, tab, justLoggedOut]);

  if (loading || !user) return <Spinner label="Loading your profile…" />;

  return (
    <div className="bg-white min-h-screen">
      <FloatingWA />
      <div className="max-w-screen-xl mx-auto px-6 md:px-16 py-12">
        <div className="flex items-center gap-4 mb-10">
          <PhotoBox icon="user" className="w-14 h-14 flex-shrink-0" />
          <div>
            <p className="font-display text-xl text-ink">{user.fullName}</p>
            <p className="text-sm text-ink/50">{user.email}</p>
          </div>
        </div>

        <div className="flex border-b border-[var(--surface-border)] mb-10">
          {(["account", "bookings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => router.replace(`/profile?tab=${t}`)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 cursor-pointer transition-colors duration-150 ${
                tab === t
                  ? "border-gold text-ink"
                  : "border-transparent text-ink/45 hover:text-ink/70"
              }`}
            >
              {t === "account" ? "Account info" : "My bookings"}
            </button>
          ))}
        </div>

        {tab === "account" ? (
          <AccountTab onSaved={refresh} />
        ) : (
          <BookingsTab />
        )}
      </div>
      <Footer />
    </div>
  );
}

function AccountTab({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    company: user?.company ?? "",
    email: user?.email ?? "",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setMsg("");
    setErr("");
    if (!form.fullName.trim()) {
      setErr("Please provide your full name.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setErr("Please provide a valid email address.");
      return;
    }
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      setErr("Please provide a valid phone number.");
      return;
    }
    try {
      await api.patch("/users/me", form);
      setMsg("Profile updated.");
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Update failed.");
    }
  }

  async function changePassword() {
    setPwMsg("");
    setPwErr("");
    if (!pw.current.trim()) {
      setPwErr("Please enter your current password.");
      return;
    }
    const passwordError = validatePassword(pw.next);
    if (passwordError) {
      setPwErr(passwordError);
      return;
    }
    try {
      await api.patch("/auth/change-password", {
        currentPassword: pw.current,
        newPassword: pw.next,
      });
      setPwMsg("Password changed.");
      setPw({ current: "", next: "" });
    } catch (e) {
      setPwErr(e instanceof ApiError ? e.message : "Change failed.");
    }
  }

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <TextField
        label="Full name"
        placeholder="e.g. Jane Doe"
        required
        value={form.fullName}
        onChange={set("fullName")}
      />
      <TextField
        label="Phone number"
        type="tel"
        placeholder="e.g. 0812 3456 7890"
        value={form.phone}
        onChange={set("phone")}
      />
      <TextField
        label="Email address"
        type="email"
        placeholder="e.g. jane@email.com"
        required
        value={form.email}
        onChange={set("email")}
      />
      <TextField
        label="Company name"
        placeholder="e.g. PT Acme Indonesia"
        value={form.company}
        onChange={set("company")}
      />
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <Alert>{err}</Alert>}
      <div>
        <Btn onClick={save}>Save changes</Btn>
      </div>

      <div className="border-t border-[var(--surface-border)] pt-6 flex flex-col gap-4">
        <SLabel>Security</SLabel>
        <p className="text-sm font-semibold text-ink -mt-3">Change password</p>
        <TextField
          label="Current password"
          type="password"
          placeholder="Your current password"
          required
          value={pw.current}
          onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
        />
        <TextField
          label="New password"
          type="password"
          placeholder="Min 8 chars, upper, lower, number & symbol"
          required
          minLength={8}
          value={pw.next}
          onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
        />
        {pwMsg && <Alert kind="success">{pwMsg}</Alert>}
        {pwErr && <Alert>{pwErr}</Alert>}
        <div>
          <OutlineBtn onClick={changePassword}>Change password</OutlineBtn>
        </div>
      </div>
    </div>
  );
}

function BookingsTab() {
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [openRef, setOpenRef] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await api.get<Inquiry[]>("/inquiries/mine");
    setInquiries(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (inquiries === null) return <Spinner />;
  if (inquiries.length === 0)
    return (
      <p className="flex items-center gap-2 text-sm text-ink/50">
        <Icon name="fileText" className="w-4 h-4 text-gold-dim" />
        You have no bookings yet.
      </p>
    );

  return (
    <div className="flex flex-col gap-2">
      <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_150px] gap-4 px-5 py-2.5 bg-cream border border-mahogany/10 text-[10px] font-semibold text-gold-dim uppercase tracking-wider">
        <span>Reference</span>
        <span>Room</span>
        <span>Requested date</span>
        <span>Status</span>
      </div>
      {inquiries.map((inq) => (
        <div key={inq.ref} className="flex flex-col">
          <button
            onClick={() => setOpenRef(openRef === inq.ref ? null : inq.ref)}
            className={`grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_150px] gap-2 sm:gap-4 px-5 py-4 bg-[var(--surface)] border text-left cursor-pointer transition-colors duration-150 hover:border-gold-dim ${
              openRef === inq.ref ? "border-gold" : "border-[var(--surface-border)]"
            }`}
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Icon name="fileText" className="w-3.5 h-3.5 text-gold-dim flex-shrink-0" />
              {inq.ref}
            </span>
            <span className="text-xs text-ink/60 hidden sm:block">
              {inq.room?.name ?? "—"}
            </span>
            <span className="text-xs text-ink/60 hidden sm:block">
              {inq.date || "—"}
            </span>
            <StatusBadge status={inq.status} />
          </button>
          {openRef === inq.ref && (
            <BookingDetail refId={inq.ref} onChanged={load} />
          )}
        </div>
      ))}
    </div>
  );
}

function BookingDetail({
  refId,
  onChanged,
}: {
  refId: string;
  onChanged: () => void;
}) {
  const [inq, setInq] = useState<Inquiry | null>(null);
  const [pay, setPay] = useState<PayPageData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    const detail = await api.get<Inquiry>(`/inquiries/${refId}`);
    setInq(detail);
    if (detail.status === "Awaiting Payment" || detail.status === "Payment Rejected") {
      try {
        setPay(await api.get<PayPageData>(`/inquiries/${refId}/payment-info`));
      } catch {
        setPay(null);
      }
    }
  }, [refId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitProof() {
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      await api.upload(`/inquiries/${refId}/proof`, file);
      setFile(null);
      await load();
      onChanged();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      await api.post(`/inquiries/${refId}/cancel`, { reason: cancelReason });
      setShowCancel(false);
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (!inq)
    return (
      <div className="border border-[var(--surface-border)] border-t-0 bg-[var(--surface)] p-5">
        <Spinner />
      </div>
    );

  const payable =
    inq.status === "Awaiting Payment" || inq.status === "Payment Rejected";

  return (
    <div className="border border-[var(--surface-border)] border-t-0 bg-[var(--surface)] p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: details */}
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink/60 uppercase tracking-wide">
          <Icon name="fileText" className="w-3.5 h-3.5 text-gold-dim" />
          Inquiry details
        </p>
        <Detail label="Room" value={inq.room?.name} />
        <Detail label="Category" value={inq.category} />
        <Detail label="Date" value={inq.date} />
        <Detail label="Start time" value={inq.time} />
        <Detail label="Duration" value={inq.duration} />
        <Detail
          label="Add-ons"
          value={inq.addons?.map((a) => a.name).join(", ") || "None"}
        />
        <Detail label="Notes" value={inq.notes} />
        {inq.agreedPrice != null && (
          <Detail label="Agreed price" value={rupiah(inq.agreedPrice)} />
        )}
      </div>

      {/* Right: status-dependent */}
      <div className="flex flex-col gap-3">
        {payable && pay && (
          <>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink/60 uppercase tracking-wide">
              <Icon name="creditCard" className="w-3.5 h-3.5 text-gold-dim" />
              Payment
            </p>
            <div className="border border-[var(--surface-border)] px-4 py-3 flex flex-col gap-1">
              <p className="font-display text-lg text-mahogany">
                {rupiah(pay.amount)}
              </p>
              <p className="text-[11px] text-ink/50">
                Due by {formatDueDate(inq.paymentDueDate)}
              </p>
              <div className="mt-2 text-xs text-ink/70">
                <p className="font-semibold text-ink">Transfer to:</p>
                <p>
                  {pay.paymentInfo.bankName} · {pay.paymentInfo.accountNumber}
                </p>
                <p>a/n {pay.paymentInfo.accountName}</p>
                {pay.paymentInfo.qrImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileUrl(pay.paymentInfo.qrImageUrl)}
                    alt="Payment QR"
                    className="w-32 h-32 object-contain mt-2 border border-[var(--surface-border)]"
                  />
                )}
                {pay.paymentInfo.instructions && (
                  <p className="mt-1 text-[11px] text-ink/50">
                    {pay.paymentInfo.instructions}
                  </p>
                )}
              </div>
            </div>

            {inq.status === "Payment Rejected" && (
              <Alert>
                Previous payment rejected: {inq.rejectionReason} (attempt{" "}
                {inq.rejectionCount})
              </Alert>
            )}

            <label className="border border-dashed border-[var(--surface-border-strong)] p-4 flex flex-col items-center gap-1.5 cursor-pointer transition-colors duration-150 hover:border-gold">
              <Icon name="upload" className="w-5 h-5 text-gold-dim" />
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
            <Btn full sm disabled={!file || busy} onClick={submitProof}>
              {busy ? "Submitting…" : "Submit payment"}
            </Btn>
          </>
        )}

        {inq.status === "Payment Submitted" && (
          <div className="border border-[var(--surface-border)] px-4 py-4 bg-cream">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink/70 uppercase tracking-wide mb-1">
              <Icon name="clock" className="w-3.5 h-3.5 text-gold-dim" />
              Payment under review
            </p>
            <p className="text-xs text-ink/50 leading-relaxed">
              Your proof has been submitted. Our team will verify and confirm
              within 1 business day.
            </p>
          </div>
        )}

        {inq.status === "Confirmed" && (
          <div className="border border-success/50 px-4 py-4 bg-success/10">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-success uppercase tracking-wide mb-1">
              <Icon name="checkCircle" className="w-3.5 h-3.5" />
              Booking confirmed
            </p>
            <p className="text-xs text-ink/60">
              Your booking is confirmed. Our team will reach out with final
              details.
            </p>
          </div>
        )}

        {inq.status === "New Inquiry" && (
          <div className="border border-[var(--surface-border)] px-4 py-4 bg-cream">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink/60 uppercase tracking-wide mb-1">
              <Icon name="info" className="w-3.5 h-3.5 text-gold-dim" />
              New inquiry
            </p>
            <p className="text-xs text-ink/50">
              Our team will contact you via WhatsApp to discuss pricing.
            </p>
          </div>
        )}

        {inq.status === "Cancelled" && (
          <div className="border border-[var(--surface-border-strong)] px-4 py-4">
            <p className="text-xs font-semibold text-ink/60 uppercase tracking-wide mb-1">
              Cancelled
            </p>
            <p className="text-xs text-ink/50">
              Cancelled by {inq.cancelledBy || "—"}
              {inq.cancelReason ? ` · ${inq.cancelReason}` : ""}
            </p>
          </div>
        )}

        {CANCELLABLE.includes(inq.status) && (
          <div className="border-t border-[var(--surface-border)] pt-3 mt-1">
            {!showCancel ? (
              <button
                onClick={() => setShowCancel(true)}
                className="text-xs text-ink/50 underline underline-offset-2 cursor-pointer hover:text-ink/80 transition-colors duration-150"
              >
                Cancel this booking
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="border border-[var(--field-border)] bg-[var(--field-bg)] text-ink placeholder:text-[var(--field-placeholder)] px-3 py-2 text-xs min-h-[60px] outline-none focus:border-gold transition-colors duration-150"
                />
                <div className="flex gap-2">
                  <Btn sm onClick={cancel} disabled={busy}>
                    Confirm cancellation
                  </Btn>
                  <OutlineBtn sm onClick={() => setShowCancel(false)}>
                    Never mind
                  </OutlineBtn>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-4">
      <span className="text-xs text-ink/45 w-24 flex-shrink-0">{label}</span>
      <span className="text-xs text-ink/85">{value || "—"}</span>
    </div>
  );
}
