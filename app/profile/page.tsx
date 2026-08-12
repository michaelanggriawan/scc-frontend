"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar, Footer, FloatingWA } from "@/components/site";
import {
  Alert,
  Btn,
  IconBox,
  OutlineBtn,
  PhotoBox,
  Spinner,
  StatusBadge,
  TextField,
} from "@/components/ui";
import { api, ApiError, fileUrl, rupiah } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"account" | "bookings">("account");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <Spinner label="Loading your profile…" />;

  return (
    <div className="bg-[#F7F7F7] min-h-screen">
      <NavBar />
      <FloatingWA />
      <div className="max-w-screen-xl mx-auto px-6 md:px-16 py-12">
        <div className="flex items-center gap-4 mb-8">
          <PhotoBox className="w-14 h-14" />
          <div>
            <p className="text-lg font-bold text-[#222]">{user.fullName}</p>
            <p className="text-sm text-[#888]">{user.email}</p>
          </div>
        </div>

        <div className="flex border-b border-[#D1D1D1] mb-8">
          {(["account", "bookings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 cursor-pointer ${
                tab === t
                  ? "border-[#222] text-[#222]"
                  : "border-transparent text-[#888]"
              }`}
            >
              {t === "account" ? "Account Info" : "My Bookings"}
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
        label="Full Name"
        placeholder="e.g. Jane Doe"
        required
        value={form.fullName}
        onChange={set("fullName")}
      />
      <TextField
        label="Phone Number"
        type="tel"
        placeholder="e.g. 0812 3456 7890"
        value={form.phone}
        onChange={set("phone")}
      />
      <TextField
        label="Email Address"
        type="email"
        placeholder="e.g. jane@email.com"
        required
        value={form.email}
        onChange={set("email")}
      />
      <TextField
        label="Company Name"
        placeholder="e.g. PT Acme Indonesia"
        value={form.company}
        onChange={set("company")}
      />
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <Alert>{err}</Alert>}
      <div>
        <Btn onClick={save}>Save Changes</Btn>
      </div>

      <div className="border-t border-[#D1D1D1] pt-6 flex flex-col gap-4">
        <p className="text-sm font-semibold text-[#222]">Change Password</p>
        <TextField
          label="Current Password"
          type="password"
          placeholder="Your current password"
          required
          value={pw.current}
          onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
        />
        <TextField
          label="New Password"
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
          <OutlineBtn onClick={changePassword}>Change Password</OutlineBtn>
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
    return <p className="text-sm text-[#888]">You have no bookings yet.</p>;

  return (
    <div className="flex flex-col gap-2">
      <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_150px] gap-4 px-5 py-2 bg-[#EBEBEB] border border-[#D1D1D1] text-[10px] font-semibold text-[#666] uppercase tracking-wider">
        <span>Reference</span>
        <span>Room</span>
        <span>Requested Date</span>
        <span>Status</span>
      </div>
      {inquiries.map((inq) => (
        <div key={inq.ref} className="flex flex-col">
          <button
            onClick={() => setOpenRef(openRef === inq.ref ? null : inq.ref)}
            className={`grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_150px] gap-2 sm:gap-4 px-5 py-4 bg-white border text-left cursor-pointer hover:bg-[#F5F5F5] ${
              openRef === inq.ref ? "border-[#222]" : "border-[#D1D1D1]"
            }`}
          >
            <span className="text-xs font-bold text-[#222]">{inq.ref}</span>
            <span className="text-xs text-[#444] hidden sm:block">
              {inq.room?.name ?? "—"}
            </span>
            <span className="text-xs text-[#444] hidden sm:block">
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

  if (!inq) return <div className="border border-[#D1D1D1] bg-white p-5"><Spinner /></div>;

  const payable =
    inq.status === "Awaiting Payment" || inq.status === "Payment Rejected";

  return (
    <div className="border border-[#D1D1D1] border-t-0 bg-white p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: details */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-[#444] uppercase tracking-wide">
          Inquiry Details
        </p>
        <Detail label="Room" value={inq.room?.name} />
        <Detail label="Category" value={inq.category} />
        <Detail label="Date" value={inq.date} />
        <Detail label="Start Time" value={inq.time} />
        <Detail label="Duration" value={inq.duration} />
        <Detail
          label="Add-ons"
          value={inq.addons?.map((a) => a.name).join(", ") || "None"}
        />
        <Detail label="Notes" value={inq.notes} />
        {inq.agreedPrice != null && (
          <Detail label="Agreed Price" value={rupiah(inq.agreedPrice)} />
        )}
      </div>

      {/* Right: status-dependent */}
      <div className="flex flex-col gap-3">
        {payable && pay && (
          <>
            <p className="text-xs font-semibold text-[#444] uppercase tracking-wide">
              Payment
            </p>
            <div className="border border-[#D1D1D1] px-4 py-3 flex flex-col gap-1">
              <p className="text-sm font-bold text-[#222]">
                {rupiah(pay.amount)}
              </p>
              <p className="text-[11px] text-[#888]">
                Due by {inq.paymentDueDate || "—"}
              </p>
              <div className="mt-2 text-xs text-[#555]">
                <p className="font-semibold">Transfer to:</p>
                <p>
                  {pay.paymentInfo.bankName} · {pay.paymentInfo.accountNumber}
                </p>
                <p>a/n {pay.paymentInfo.accountName}</p>
                {pay.paymentInfo.qrImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileUrl(pay.paymentInfo.qrImageUrl)}
                    alt="Payment QR"
                    className="w-32 h-32 object-contain mt-2 border border-[#EBEBEB]"
                  />
                )}
                {pay.paymentInfo.instructions && (
                  <p className="mt-1 text-[11px] text-[#888]">
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

            <label className="border border-dashed border-[#AAAAAA] p-4 flex flex-col items-center gap-1 cursor-pointer">
              <IconBox className="w-6 h-6" />
              <span className="text-xs text-[#888]">
                {file ? file.name : "Upload Proof of Payment"}
              </span>
              <span className="text-[10px] text-[#AAAAAA]">
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
              {busy ? "Submitting…" : "Submit Payment"}
            </Btn>
          </>
        )}

        {inq.status === "Payment Submitted" && (
          <div className="border border-[#D1D1D1] px-4 py-4 bg-[#F7F7F7]">
            <p className="text-xs font-semibold text-[#444] uppercase tracking-wide mb-1">
              Payment Under Review
            </p>
            <p className="text-xs text-[#888] leading-relaxed">
              Your proof has been submitted. Our team will verify and confirm
              within 1 business day.
            </p>
          </div>
        )}

        {inq.status === "Confirmed" && (
          <div className="border border-[#222] px-4 py-4">
            <p className="text-xs font-semibold text-[#222] uppercase tracking-wide mb-1">
              Booking Confirmed
            </p>
            <p className="text-xs text-[#555]">
              Your booking is confirmed. Our team will reach out with final
              details.
            </p>
          </div>
        )}

        {inq.status === "New Inquiry" && (
          <div className="border border-[#D1D1D1] px-4 py-4 bg-[#F7F7F7]">
            <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-1">
              New Inquiry
            </p>
            <p className="text-xs text-[#888]">
              Our team will contact you via WhatsApp to discuss pricing.
            </p>
          </div>
        )}

        {inq.status === "Cancelled" && (
          <div className="border border-[#AAAAAA] px-4 py-4">
            <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-1">
              Cancelled
            </p>
            <p className="text-xs text-[#888]">
              Cancelled by {inq.cancelledBy || "—"}
              {inq.cancelReason ? ` · ${inq.cancelReason}` : ""}
            </p>
          </div>
        )}

        {CANCELLABLE.includes(inq.status) && (
          <div className="border-t border-[#EBEBEB] pt-3 mt-1">
            {!showCancel ? (
              <button
                onClick={() => setShowCancel(true)}
                className="text-xs text-[#888] underline cursor-pointer"
              >
                Cancel this booking
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="border border-[#AAAAAA] bg-white px-3 py-2 text-xs min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Btn sm onClick={cancel} disabled={busy}>
                    Confirm Cancellation
                  </Btn>
                  <OutlineBtn sm onClick={() => setShowCancel(false)}>
                    Never Mind
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
      <span className="text-xs text-[#888] w-24 flex-shrink-0">{label}</span>
      <span className="text-xs text-[#333]">{value || "—"}</span>
    </div>
  );
}
