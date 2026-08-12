"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Btn, Icon, OutlineBtn, Select, TextArea } from "./ui";
import { api, ApiError, fileUrl, rupiah } from "@/lib/api";
import {
  defaultDueDateLocal,
  fromDatetimeLocal,
  toDatetimeLocal,
} from "@/lib/datetime";
import { blockNonDigitKeys, blockNonDigitPaste } from "@/lib/validation";
import type { AddOn, Inquiry, Room } from "@/lib/types";

const EDITABLE = ["New Inquiry", "Awaiting Payment", "Payment Rejected"];

// Inline preview of an uploaded proof, served through the API at /files/<key>.
// Uses a plain <img> (arbitrary API-served file, not a build-time asset) and
// falls back to a generic icon for PDFs or if the image can't load.
function ProofThumb({ url, alt }: { url: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <Icon name="image" className="w-5 h-5" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

export function AdminInquiryPanel({
  refId,
  rooms,
  addons,
  onChanged,
  onClose,
}: {
  refId: string;
  rooms: Room[];
  addons: AddOn[];
  onChanged: () => void;
  onClose: () => void;
}) {
  const [inq, setInq] = useState<Inquiry | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // editable fields
  const [roomId, setRoomId] = useState("");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [link, setLink] = useState("");

  const load = useCallback(async () => {
    const d = await api.get<Inquiry>(`/admin/inquiries/${refId}`);
    setInq(d);
    setRoomId(d.roomId ?? "");
    setAddonIds(d.addonIds ?? []);
    setPrice(d.agreedPrice != null ? String(d.agreedPrice) : "");
    setDueDate(
      d.paymentDueDate ? toDatetimeLocal(d.paymentDueDate) : defaultDueDateLocal(),
    );
    setAdminNotes(d.adminNotes ?? "");
  }, [refId]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(fn: () => Promise<unknown>) {
    setErr("");
    setBusy(true);
    try {
      await fn();
      await load();
      onChanged();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!inq)
    return (
      <div className="border-t border-[var(--surface-border)] bg-cream p-6 text-xs text-[var(--text-muted)]">
        Loading…
      </div>
    );

  const canEdit = EDITABLE.includes(inq.status);
  const toggleAddon = (id: string) =>
    setAddonIds((p) => (p.includes(id) ? p.filter((a) => a !== id) : [...p, id]));

  const selectableRooms = rooms.filter(
    (r) => r.status === "Active" || r.id === roomId,
  );
  const selectableAddons = addons.filter(
    (a) => a.status === "Active" || addonIds.includes(a.id),
  );

  return (
    <div className="border-t border-[var(--surface-border)] bg-cream p-7 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: details + proof */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <p className="font-display text-lg text-ink">Inquiry — {inq.ref}</p>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-mahogany cursor-pointer"
          >
            <Icon name="close" className="w-3.5 h-3.5" />
            Close
          </button>
        </div>
        <D label="Customer" value={`${inq.customerName} (${inq.customerEmail})`} />
        <D label="Phone" value={inq.customerPhone} />
        <D label="Date" value={`${inq.date} ${inq.time}`} />
        <D label="Duration" value={inq.duration} />
        <D label="Category" value={inq.category} />
        <D label="Notes" value={inq.notes} />
        {inq.rejectionCount > 0 && (
          <D label="Rejections" value={String(inq.rejectionCount)} />
        )}

        {inq.status === "Payment Submitted" && (
          <div className="mt-2 border border-[var(--surface-border)] bg-white px-5 py-4">
            <p className="text-xs font-semibold text-ink mb-3 uppercase tracking-wide">
              Proof of Payment
            </p>
            {inq.proofs && inq.proofs.length > 0 ? (
              <div className="flex items-center gap-3">
                <a
                  href={fileUrl(inq.proofs[0].fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-16 h-12 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gold-dim/50 bg-mahogany-2 text-gold hover:border-gold transition-colors"
                >
                  <ProofThumb
                    url={fileUrl(inq.proofs[0].fileUrl)}
                    alt={inq.proofs[0].fileName}
                  />
                </a>
                <div className="text-xs text-[var(--text-muted)]">
                  <p className="text-ink">{inq.proofs[0].fileName}</p>
                  <a
                    href={fileUrl(inq.proofs[0].fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-mahogany hover:text-gold-dim underline"
                  >
                    Open file
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">No file.</p>
            )}
            {!rejecting ? (
              <div className="flex gap-2 mt-4">
                <Btn sm disabled={busy} onClick={() => run(() => api.post(`/admin/inquiries/${inq.ref}/approve`))}>
                  Approve
                </Btn>
                <OutlineBtn sm onClick={() => setRejecting(true)}>
                  Reject
                </OutlineBtn>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <TextArea
                  label="Rejection Reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Customer will see this"
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Btn
                    sm
                    disabled={busy || !rejectReason.trim()}
                    onClick={() =>
                      run(() =>
                        api.post(`/admin/inquiries/${inq.ref}/reject`, {
                          reason: rejectReason,
                        }),
                      ).then(() => setRejecting(false))
                    }
                  >
                    Send Rejection
                  </Btn>
                  <OutlineBtn sm onClick={() => setRejecting(false)}>
                    Cancel
                  </OutlineBtn>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: admin actions */}
      <div className="flex flex-col gap-4">
        <p className="font-display text-lg text-ink">Admin Actions</p>

        {inq.status === "Cancelled" ? (
          <div className="border border-[var(--surface-border)] bg-white p-5 text-xs text-[var(--text-muted)]">
            <p className="font-semibold text-mahogany uppercase mb-1 tracking-wide">Cancelled</p>
            <p>Cancelled by {inq.cancelledBy || "—"}</p>
            {inq.cancelReason && <p>Reason: {inq.cancelReason}</p>}
          </div>
        ) : (
          <div className="border border-[var(--surface-border)] bg-white p-5 flex flex-col gap-4">
            {canEdit ? (
              <>
                <Select label="Room" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                  <option value="">— none —</option>
                  {selectableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
                    Add-ons
                  </span>
                  <div className="flex flex-col gap-2 border border-[var(--field-border)] p-3">
                    {selectableAddons.length === 0 && (
                      <span className="text-xs text-[var(--text-muted)]">None</span>
                    )}
                    {selectableAddons.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addonIds.includes(a.id)}
                          onChange={() => toggleAddon(a.id)}
                          className="gold-checkbox"
                        />
                        <span className="text-xs text-ink">{a.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
                    Agreed Price (IDR)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    onKeyDown={blockNonDigitKeys}
                    onPaste={blockNonDigitPaste}
                    placeholder="e.g. 75000000"
                    className="border border-[var(--field-border)] bg-[var(--field-bg)] h-11 px-3.5 text-sm text-ink outline-none focus:border-gold transition-colors"
                  />
                </label>

                <TextArea
                  label="Admin Notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes — not visible to the customer"
                  className="min-h-[50px]"
                />

                <OutlineBtn
                  full
                  sm
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      api.patch(`/admin/inquiries/${inq.ref}`, {
                        roomId: roomId || null,
                        addonIds,
                        agreedPrice: price ? Number(price) : null,
                        paymentDueDate: dueDate ? fromDatetimeLocal(dueDate) : undefined,
                        adminNotes,
                      }),
                    )
                  }
                >
                  Save Changes
                </OutlineBtn>

                <div className="border-t border-[var(--surface-border)] pt-4 flex flex-col gap-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
                      Payment Due Date
                    </span>
                    <input
                      type="datetime-local"
                      min={toDatetimeLocal(new Date().toISOString())}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="border border-[var(--field-border)] bg-[var(--field-bg)] h-11 px-3.5 text-sm text-ink outline-none focus:border-gold transition-colors"
                    />
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Defaults to 24 hours from now — adjust if needed.
                    </span>
                  </label>
                  {inq.status !== "Awaiting Payment" ? (
                    <>
                      <Btn
                        full
                        disabled={busy || !price.trim() || !dueDate}
                        onClick={() =>
                          run(async () => {
                            const res = await api.post<{ paymentLink: string }>(
                              `/admin/inquiries/${inq.ref}/awaiting-payment`,
                              {
                                agreedPrice: Number(price),
                                paymentDueDate: fromDatetimeLocal(dueDate),
                                roomId: roomId || null,
                                addonIds,
                                adminNotes,
                              },
                            );
                            setLink(res.paymentLink);
                          })
                        }
                      >
                        Mark as Awaiting Payment
                      </Btn>
                      {!price.trim() && (
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Set an agreed price and due date first.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Awaiting the customer&apos;s proof of payment. Use Save
                      Changes to correct the price or due date.
                    </p>
                  )}
                  {link && (
                    <Alert kind="success">
                      Payment link:{" "}
                      <a href={link} target="_blank" rel="noreferrer" className="underline break-all">
                        {link}
                      </a>
                    </Alert>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 text-xs">
                <p className="text-[10px] font-semibold text-mahogany uppercase tracking-wide">
                  Terms Locked
                </p>
                <D label="Room" value={inq.room?.name} />
                <D label="Price" value={rupiah(inq.agreedPrice)} />
                <p className="text-[10px] text-[var(--text-muted)]">
                  Terms lock once payment is submitted or confirmed.
                </p>
              </div>
            )}

            <div className="border-t border-[var(--surface-border)] pt-4">
              {!cancelling ? (
                <OutlineBtn full sm onClick={() => setCancelling(true)}>
                  Cancel Inquiry
                </OutlineBtn>
              ) : (
                <div className="flex flex-col gap-2">
                  <TextArea
                    label="Reason (optional)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="min-h-[50px]"
                  />
                  <div className="flex gap-2">
                    <Btn
                      sm
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          api.post(`/admin/inquiries/${inq.ref}/cancel`, {
                            reason: cancelReason,
                          }),
                        ).then(() => setCancelling(false))
                      }
                    >
                      Confirm Cancellation
                    </Btn>
                    <OutlineBtn sm onClick={() => setCancelling(false)}>
                      Never Mind
                    </OutlineBtn>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {err && <Alert>{err}</Alert>}
      </div>
    </div>
  );
}

function D({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-4">
      <span className="text-xs text-[var(--text-muted)] w-24 flex-shrink-0">{label}</span>
      <span className="text-xs text-ink break-words">{value || "—"}</span>
    </div>
  );
}
