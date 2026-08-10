"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Btn, OutlineBtn, PhotoBox } from "./ui";
import { api, ApiError, fileUrl, rupiah } from "@/lib/api";
import type { AddOn, Inquiry, Room } from "@/lib/types";

const EDITABLE = ["New Inquiry", "Awaiting Payment", "Payment Rejected"];

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
    setDueDate(d.paymentDueDate ?? "");
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
      <div className="border-t border-[#D1D1D1] bg-[#F7F7F7] p-6 text-xs text-[#888]">
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
    <div className="border-t border-[#D1D1D1] bg-[#F7F7F7] p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: details + proof */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-[#222]">Inquiry — {inq.ref}</p>
          <button
            onClick={onClose}
            className="text-xs text-[#888] underline cursor-pointer"
          >
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
          <div className="mt-2 border border-[#D1D1D1] bg-white px-4 py-3">
            <p className="text-xs font-semibold text-[#333] mb-2">
              Proof of Payment
            </p>
            {inq.proofs && inq.proofs.length > 0 ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <a
                  href={fileUrl(inq.proofs[0].fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <PhotoBox label="[ View ]" className="w-16 h-12" />
                </a>
                <div className="text-xs text-[#555]">
                  <p>{inq.proofs[0].fileName}</p>
                  <a
                    href={fileUrl(inq.proofs[0].fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-[#555]"
                  >
                    Open file
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#888]">No file.</p>
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
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Rejection reason — customer will see this"
                  className="border border-[#AAAAAA] bg-white px-3 py-2 text-xs min-h-[60px]"
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
        <p className="text-sm font-bold text-[#222]">Admin Actions</p>

        {inq.status === "Cancelled" ? (
          <div className="border border-[#AAAAAA] bg-white p-4 text-xs text-[#555]">
            <p className="font-semibold text-[#888] uppercase mb-1">Cancelled</p>
            <p>Cancelled by {inq.cancelledBy || "—"}</p>
            {inq.cancelReason && <p>Reason: {inq.cancelReason}</p>}
          </div>
        ) : (
          <div className="border border-[#D1D1D1] bg-white p-4 flex flex-col gap-4">
            {canEdit ? (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
                    Room
                  </span>
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="border border-[#AAAAAA] bg-white h-10 px-3 text-sm"
                  >
                    <option value="">— none —</option>
                    {selectableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
                    Add-ons
                  </span>
                  <div className="flex flex-col gap-2 border border-[#EBEBEB] p-3">
                    {selectableAddons.length === 0 && (
                      <span className="text-xs text-[#AAAAAA]">None</span>
                    )}
                    {selectableAddons.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addonIds.includes(a.id)}
                          onChange={() => toggleAddon(a.id)}
                        />
                        <span className="text-xs text-[#333]">{a.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
                    Agreed Price (IDR)
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 75000000"
                    className="border border-[#AAAAAA] bg-white h-10 px-3 text-sm"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
                    Admin Notes
                  </span>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="border border-[#AAAAAA] bg-white px-3 py-2 text-sm min-h-[50px]"
                  />
                </label>

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
                        adminNotes,
                      }),
                    )
                  }
                >
                  Save Changes
                </OutlineBtn>

                <div className="border-t border-[#EBEBEB] pt-4 flex flex-col gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
                      Payment Due Date
                    </span>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="border border-[#AAAAAA] bg-white h-10 px-3 text-sm"
                    />
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
                                paymentDueDate: dueDate,
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
                        <p className="text-[10px] text-[#AAAAAA]">
                          Set an agreed price and due date first.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] text-[#888]">
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
                <p className="text-[10px] font-semibold text-[#444] uppercase">
                  Terms Locked
                </p>
                <D label="Room" value={inq.room?.name} />
                <D label="Price" value={rupiah(inq.agreedPrice)} />
                <p className="text-[10px] text-[#AAAAAA]">
                  Terms lock once payment is submitted or confirmed.
                </p>
              </div>
            )}

            <div className="border-t border-[#EBEBEB] pt-4">
              {!cancelling ? (
                <OutlineBtn full sm onClick={() => setCancelling(true)}>
                  Cancel Inquiry
                </OutlineBtn>
              ) : (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="border border-[#AAAAAA] bg-white px-3 py-2 text-xs min-h-[50px]"
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
      <span className="text-xs text-[#888] w-24 flex-shrink-0">{label}</span>
      <span className="text-xs text-[#333] break-words">{value || "—"}</span>
    </div>
  );
}
