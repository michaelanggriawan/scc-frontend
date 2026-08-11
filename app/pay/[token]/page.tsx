"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Alert, Btn, IconBox, PhotoBox, Spinner } from "@/components/ui";
import { api, ApiError, fileUrl, rupiah } from "@/lib/api";
import { isValidUploadSize, MAX_UPLOAD_MB } from "@/lib/validation";
import type { PayPageData } from "@/lib/types";

export default function PayPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [data, setData] = useState<PayPageData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.get<PayPageData>(`/pay/${token}`));
    } catch {
      setNotFound(true);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

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
        <h1 className="text-xl font-bold text-[#222]">Link not valid</h1>
        <p className="text-sm text-[#666]">
          This payment link is invalid, expired, or already used. Please contact
          us or check your bookings.
        </p>
        <Link href="/" className="text-xs underline text-[#555]">
          ← Back to site
        </Link>
      </Centered>
    );

  if (!data) return <Spinner label="Loading payment page…" />;

  if (done)
    return (
      <Centered>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888]">
          Payment Submitted
        </p>
        <h1 className="text-xl font-bold text-[#222]">Thank you!</h1>
        <p className="text-sm text-[#666]">
          We&apos;ve received your proof of payment for{" "}
          <span className="font-bold text-[#222]">{data.ref}</span>. Our team
          will verify and confirm shortly.
        </p>
      </Centered>
    );

  return (
    <div className="min-h-screen bg-[#F0F0F0] py-12 px-6">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <div className="text-center">
          <PhotoBox label="[ SCC ]" className="w-28 h-8 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#222]">Complete Your Payment</h1>
          <p className="text-sm text-[#888]">Booking {data.ref}</p>
        </div>

        <div className="bg-white border border-[#D1D1D1] p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#EBEBEB] pb-3">
            <span className="text-sm text-[#666]">Amount Due</span>
            <span className="text-lg font-bold text-[#222]">
              {rupiah(data.amount)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#888]">Room</span>
            <span className="text-[#333]">{data.room?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#888]">Due By</span>
            <span className="text-[#333]">{data.dueDate ?? "—"}</span>
          </div>

          <div className="border border-[#D1D1D1] bg-[#FAFAFA] px-4 py-3 mt-1">
            <p className="text-xs font-semibold text-[#444] uppercase tracking-wide mb-2">
              Transfer To
            </p>
            <p className="text-sm font-bold text-[#222]">
              {data.paymentInfo.bankName}
            </p>
            <p className="text-sm text-[#333]">
              {data.paymentInfo.accountNumber}
            </p>
            <p className="text-xs text-[#666]">
              a/n {data.paymentInfo.accountName}
            </p>
            {data.paymentInfo.qrImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fileUrl(data.paymentInfo.qrImageUrl)}
                alt="Payment QR"
                className="w-40 h-40 object-contain mt-3 border border-[#EBEBEB]"
              />
            )}
            {data.paymentInfo.instructions && (
              <p className="text-[11px] text-[#888] mt-2">
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
              <label className="border border-dashed border-[#AAAAAA] p-5 flex flex-col items-center gap-1 cursor-pointer">
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
              <Btn full disabled={!file || busy} onClick={submit}>
                {busy ? "Submitting…" : "Submit Payment"}
              </Btn>
            </>
          )}
        </div>
        <p className="text-[10px] text-[#999] text-center">
          If payment isn&apos;t received by the due date, this booking is
          automatically cancelled.
        </p>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center px-6">
      <div className="max-w-md text-center flex flex-col gap-3">{children}</div>
    </div>
  );
}
