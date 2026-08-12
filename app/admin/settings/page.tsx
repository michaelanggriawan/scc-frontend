"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import {
  Alert,
  Btn,
  Icon,
  PhotoBox,
  SLabel,
  Spinner,
  TextArea,
  TextField,
} from "@/components/ui";
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
      <div className="px-4 md:px-8 py-6 md:py-8 flex flex-col gap-8 max-w-2xl">
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
    <div className="bg-white border border-[var(--surface-border)] p-7 flex flex-col gap-5">
      <div>
        <SLabel>Venue</SLabel>
        <h2 className="font-display text-2xl text-ink">Venue info</h2>
      </div>
      <TextField
        label="Venue name"
        placeholder="e.g. Serpong Convention Center"
        value={v.name}
        onChange={(e) => setV({ ...v, name: e.target.value })}
      />
      <TextField
        label="Address"
        placeholder="e.g. Jl. Raya Serpong No. 1, Tangerang"
        value={v.address}
        onChange={(e) => setV({ ...v, address: e.target.value })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label="Phone"
          type="tel"
          placeholder="e.g. 021 5555 0000"
          value={v.phone}
          onChange={(e) => setV({ ...v, phone: e.target.value })}
        />
        <TextField
          label="WhatsApp"
          type="tel"
          placeholder="e.g. +62 811 0000 0000"
          value={v.whatsapp}
          onChange={(e) => setV({ ...v, whatsapp: e.target.value })}
        />
      </div>
      <TextField
        label="Email"
        type="email"
        placeholder="e.g. info@venue.com"
        value={v.email}
        onChange={(e) => setV({ ...v, email: e.target.value })}
      />
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <Alert>{err}</Alert>}
      <div>
        <Btn sm disabled={busy} onClick={submit}>
          Save venue info
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
    <div className="bg-white border border-[var(--surface-border)] p-7 flex flex-col gap-5">
      <div>
        <SLabel>Payment</SLabel>
        <h2 className="font-display text-2xl text-ink">Payment info</h2>
      </div>
      <TextField
        label="Bank name"
        placeholder="e.g. BCA"
        value={p.bankName}
        onChange={(e) => setP({ ...p, bankName: e.target.value })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label="Account number"
          inputMode="numeric"
          placeholder="e.g. 1234567890"
          onKeyDown={blockNonDigitKeys}
          onPaste={blockNonDigitPaste}
          value={p.accountNumber}
          onChange={(e) => setP({ ...p, accountNumber: e.target.value })}
        />
        <TextField
          label="Account name"
          placeholder="e.g. PT SCC Venue Indonesia"
          value={p.accountName}
          onChange={(e) => setP({ ...p, accountName: e.target.value })}
        />
      </div>
      <TextArea
        label="Instructions"
        value={p.instructions}
        onChange={(e) => setP({ ...p, instructions: e.target.value })}
        placeholder="e.g. Transfer the exact amount and upload your receipt."
        className="min-h-[60px]"
      />
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
          Payment QR (QRIS)
        </span>
        <div className="flex flex-wrap items-center gap-4">
          {p.qrImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl(p.qrImageUrl)}
              alt="QR code"
              className="w-24 h-24 object-contain border border-[var(--surface-border)] bg-white"
            />
          ) : (
            <PhotoBox icon="creditCard" label="No QR yet" className="w-24 h-24 flex-shrink-0" />
          )}
          <label className="flex items-center gap-2 border border-dashed border-[var(--field-border)] px-4 py-3 text-xs text-[var(--text-muted)] cursor-pointer hover:border-gold transition-colors">
            <Icon name="upload" className="w-4 h-4 text-gold flex-shrink-0" />
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
          Save payment info
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
    <div className="bg-white border border-[var(--surface-border)] p-7 flex flex-col gap-4">
      <div>
        <SLabel>Notifications</SLabel>
        <h2 className="font-display text-2xl text-ink">Notification preferences</h2>
      </div>
      <div className="flex flex-col gap-3 mt-1">
        {NOTIF_ITEMS.map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-3 cursor-pointer border border-[var(--surface-border)] bg-[var(--field-bg)] px-4 py-3"
          >
            <input
              type="checkbox"
              checked={n[item.key]}
              onChange={(e) => setN({ ...n, [item.key]: e.target.checked })}
              className="gold-checkbox"
            />
            <span className="text-sm text-[var(--text-primary)]">{item.label}</span>
          </label>
        ))}
      </div>
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <Alert>{err}</Alert>}
      <div>
        <Btn sm disabled={busy} onClick={() => save(() => api.put("/admin/settings/notifications", n))}>
          Save preferences
        </Btn>
      </div>
    </div>
  );
}
