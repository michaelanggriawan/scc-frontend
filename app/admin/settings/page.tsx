"use client";

import { useEffect, useState, type InputHTMLAttributes } from "react";
import { AdminHeader } from "@/components/admin-header";
import { Alert, Btn, Spinner } from "@/components/ui";
import { api, ApiError, fileUrl } from "@/lib/api";
import {
  blockNonDigitKeys,
  blockNonDigitPaste,
  isValidEmail,
  isValidPhone,
  isValidUploadSize,
  MAX_UPLOAD_MB,
} from "@/lib/validation";
import type { NotificationPrefs, PaymentInfo, VenueInfo } from "@/lib/types";

export default function AdminSettingsPage() {
  const [venue, setVenue] = useState<VenueInfo | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [notif, setNotif] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    api.get<VenueInfo>("/admin/settings/venue").then(setVenue);
    api.get<PaymentInfo>("/admin/settings/payment").then(setPayment);
    api.get<NotificationPrefs>("/admin/settings/notifications").then(setNotif);
  }, []);

  if (!venue || !payment || !notif) return <Spinner label="Loading settings…" />;

  return (
    <>
      <AdminHeader title="Settings" />
      <div className="px-8 py-8 flex flex-col gap-10 max-w-2xl">
        <VenueSection initial={venue} />
        <PaymentSection initial={payment} />
        <NotifSection initial={notif} />
      </div>
    </>
  );
}

function useSaver() {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(fn: () => Promise<unknown>) {
    setMsg("");
    setErr("");
    setBusy(true);
    try {
      await fn();
      setMsg("Saved.");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  return { msg, err, setErr, busy, save };
}

function Row({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
        className="border border-[#AAAAAA] bg-white h-10 px-3 text-sm"
      />
    </label>
  );
}

function VenueSection({ initial }: { initial: VenueInfo }) {
  const [v, setV] = useState(initial);
  const { msg, err, setErr, busy, save } = useSaver();

  function submit() {
    if (v.email.trim() && !isValidEmail(v.email)) {
      setErr("Please provide a valid email address.");
      return;
    }
    if (v.whatsapp.trim() && !isValidPhone(v.whatsapp)) {
      setErr("Please provide a valid WhatsApp number.");
      return;
    }
    if (v.phone.trim() && !isValidPhone(v.phone)) {
      setErr("Please provide a valid phone number.");
      return;
    }
    save(() => api.put("/admin/settings/venue", v));
  }

  return (
    <div className="bg-white border border-[#D1D1D1] p-6 flex flex-col gap-5">
      <h2 className="text-sm font-bold text-[#222] border-b border-[#D1D1D1] pb-3">
        Venue Info
      </h2>
      <Row
        label="Venue Name"
        placeholder="e.g. Serpong Convention Center"
        value={v.name}
        onChange={(x) => setV({ ...v, name: x })}
      />
      <Row
        label="Address"
        placeholder="e.g. Jl. Raya Serpong No. 1, Tangerang"
        value={v.address}
        onChange={(x) => setV({ ...v, address: x })}
      />
      <div className="grid grid-cols-2 gap-4">
        <Row
          label="Phone"
          type="tel"
          placeholder="e.g. 021 5555 0000"
          value={v.phone}
          onChange={(x) => setV({ ...v, phone: x })}
        />
        <Row
          label="WhatsApp"
          type="tel"
          placeholder="e.g. +62 811 0000 0000"
          value={v.whatsapp}
          onChange={(x) => setV({ ...v, whatsapp: x })}
        />
      </div>
      <Row
        label="Email"
        type="email"
        placeholder="e.g. info@venue.com"
        value={v.email}
        onChange={(x) => setV({ ...v, email: x })}
      />
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <Alert>{err}</Alert>}
      <div>
        <Btn sm disabled={busy} onClick={submit}>
          Save Venue Info
        </Btn>
      </div>
    </div>
  );
}

function PaymentSection({ initial }: { initial: PaymentInfo }) {
  const [p, setP] = useState(initial);
  const { msg, err, setErr, busy, save } = useSaver();
  const [uploading, setUploading] = useState(false);

  async function uploadQr(file: File) {
    if (!isValidUploadSize(file)) {
      setErr(`QR image must be ${MAX_UPLOAD_MB} MB or smaller.`);
      return;
    }
    setUploading(true);
    try {
      const res = await api.upload<{ fileUrl: string }>("/admin/uploads/qr", file);
      setP((prev) => ({ ...prev, qrImageUrl: res.fileUrl }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white border border-[#D1D1D1] p-6 flex flex-col gap-5">
      <h2 className="text-sm font-bold text-[#222] border-b border-[#D1D1D1] pb-3">
        Payment Info
      </h2>
      <Row
        label="Bank Name"
        placeholder="e.g. BCA"
        value={p.bankName}
        onChange={(x) => setP({ ...p, bankName: x })}
      />
      <div className="grid grid-cols-2 gap-4">
        <Row
          label="Account Number"
          inputMode="numeric"
          placeholder="e.g. 1234567890"
          onKeyDown={blockNonDigitKeys}
          onPaste={blockNonDigitPaste}
          value={p.accountNumber}
          onChange={(x) => setP({ ...p, accountNumber: x })}
        />
        <Row
          label="Account Name"
          placeholder="e.g. PT SCC Venue Indonesia"
          value={p.accountName}
          onChange={(x) => setP({ ...p, accountName: x })}
        />
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
          Instructions
        </span>
        <textarea
          value={p.instructions}
          onChange={(e) => setP({ ...p, instructions: e.target.value })}
          placeholder="e.g. Transfer the exact amount and upload your receipt."
          className="border border-[#AAAAAA] bg-white px-3 py-2 text-sm min-h-[60px]"
        />
      </label>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
          Payment QR (QRIS)
        </span>
        <div className="flex items-center gap-4">
          {p.qrImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl(p.qrImageUrl)}
              alt="QR"
              className="w-24 h-24 object-contain border border-[#EBEBEB]"
            />
          )}
          <label className="border border-dashed border-[#AAAAAA] px-4 py-3 text-xs text-[#888] cursor-pointer">
            {uploading ? "Uploading…" : `Upload QR image · Max ${MAX_UPLOAD_MB} MB`}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadQr(e.target.files[0])}
            />
          </label>
        </div>
      </div>
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <Alert>{err}</Alert>}
      <div>
        <Btn sm disabled={busy} onClick={() => save(() => api.put("/admin/settings/payment", p))}>
          Save Payment Info
        </Btn>
      </div>
    </div>
  );
}

const NOTIF_ITEMS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: "newInquiry", label: "Email me when a new inquiry is submitted" },
  { key: "paymentSubmitted", label: "Email me when a customer submits proof of payment" },
  { key: "linkExpiringSoon", label: "Email me when a payment link is about to expire" },
  { key: "dailySummary", label: "Send a daily summary of inquiry activity" },
];

function NotifSection({ initial }: { initial: NotificationPrefs }) {
  const [n, setN] = useState(initial);
  const { msg, err, busy, save } = useSaver();
  return (
    <div className="bg-white border border-[#D1D1D1] p-6 flex flex-col gap-4">
      <h2 className="text-sm font-bold text-[#222] border-b border-[#D1D1D1] pb-3">
        Notification Preferences
      </h2>
      {NOTIF_ITEMS.map((item) => (
        <label key={item.key} className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={n[item.key]}
            onChange={(e) => setN({ ...n, [item.key]: e.target.checked })}
          />
          <span className="text-sm text-[#333]">{item.label}</span>
        </label>
      ))}
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <Alert>{err}</Alert>}
      <div>
        <Btn sm disabled={busy} onClick={() => save(() => api.put("/admin/settings/notifications", n))}>
          Save Preferences
        </Btn>
      </div>
    </div>
  );
}
