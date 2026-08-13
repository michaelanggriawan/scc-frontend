"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { AdminInquiryPanel } from "@/components/admin-inquiry-panel";
import { Alert, Icon, StatusBadge, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { AddOn, DashboardStats, Inquiry, Room } from "@/lib/types";

interface ChartResp {
  year: number;
  series: { month: string; count: number }[];
}
interface ListResp {
  items: Inquiry[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chart, setChart] = useState<ChartResp | null>(null);
  const [recent, setRecent] = useState<Inquiry[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [openRef, setOpenRef] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<{ ref: string; link: string } | null>(null);

  const load = useCallback(async () => {
    const [s, c, list, r, a] = await Promise.all([
      api.get<DashboardStats>("/admin/dashboard/stats"),
      api.get<ChartResp>("/admin/dashboard/chart"),
      api.get<ListResp>("/admin/inquiries?limit=5"),
      api.get<Room[]>("/admin/rooms"),
      api.get<AddOn[]>("/admin/addons"),
    ]);
    setStats(s);
    setChart(c);
    setRecent(list.items);
    setRooms(r);
    setAddons(a);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!stats || !chart)
    return (
      <>
        <AdminHeader title="Dashboard" />
        <Spinner label="Loading dashboard…" />
      </>
    );

  const max = Math.max(1, ...chart.series.map((s) => s.count));

  const cards = [
    ["calendar", "Total Inquiries", stats.totalInquiries],
    ["clock", "Awaiting Payment", stats.awaitingPayment],
    ["checkCircle", "Confirmed", stats.confirmed],
    ["building", "Active Rooms", stats.activeRooms],
  ] as const;

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        {paymentNotice && (
          <Alert kind="success">
            Payment link generated for {paymentNotice.ref}:{" "}
            <a
              href={paymentNotice.link}
              target="_blank"
              rel="noreferrer"
              className="underline break-all"
            >
              {paymentNotice.link}
            </a>
            <button
              onClick={() => setPaymentNotice(null)}
              className="ml-3 underline cursor-pointer"
            >
              Dismiss
            </button>
          </Alert>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map(([icon, label, value]) => (
            <div
              key={label}
              className="bg-white border border-[var(--surface-border)] px-6 py-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
                <Icon name={icon} className="w-4 h-4 text-gold-dim" />
              </div>
              <p className="font-display text-4xl text-ink">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[var(--surface-border)] p-7">
          <p className="font-display text-xl text-ink mb-6">
            Inquiries Over Time ({chart.year})
          </p>
          <div className="flex items-end gap-3 h-48 border-b border-l border-[var(--surface-border)] px-2">
            {chart.series.map((s) => (
              <div key={s.month} className="flex-1 h-full flex items-end group" title={`${s.month}: ${s.count}`}>
                <div
                  className="w-full bg-[linear-gradient(180deg,var(--color-gold-light),var(--color-gold))] group-hover:brightness-110 transition-[height]"
                  style={{ height: `${(s.count / max) * 100}%`, minHeight: s.count > 0 ? 3 : 0 }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-1 px-2">
            {chart.series.map((s) => (
              <div key={s.month} className="flex-1 text-center text-[9px] text-[var(--text-muted)]">
                {s.month}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[var(--surface-border)]">
          <div className="px-6 py-5 border-b border-[var(--surface-border)]">
            <p className="font-display text-xl text-ink">Recent Inquiries</p>
          </div>
          <InquiryTable
            rows={recent}
            rooms={rooms}
            addons={addons}
            openRef={openRef}
            setOpenRef={setOpenRef}
            onChanged={load}
            onPaymentLinkReady={(ref, link) => setPaymentNotice({ ref, link })}
          />
        </div>
      </div>
    </>
  );
}

export function InquiryTable({
  rows,
  rooms,
  addons,
  openRef,
  setOpenRef,
  onChanged,
  onPaymentLinkReady,
}: {
  rows: Inquiry[];
  rooms: Room[];
  addons: AddOn[];
  openRef: string | null;
  setOpenRef: (r: string | null) => void;
  onChanged: () => void;
  onPaymentLinkReady?: (ref: string, link: string) => void;
}) {
  const roomName = (id: string | null) =>
    rooms.find((r) => r.id === id)?.name ?? "—";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="border-b border-[var(--surface-border)] bg-cream">
            {["Ref", "Customer", "Room", "Date", "Status"].map((h) => (
              <th
                key={h}
                className="text-left text-[10px] font-semibold text-gold-dim uppercase tracking-wider px-5 py-3.5"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Fragment key={row.ref}>
              <tr
                onClick={() => setOpenRef(openRef === row.ref ? null : row.ref)}
                className={`border-b border-[var(--surface-border)] cursor-pointer hover:bg-cream/60 transition-colors ${
                  openRef === row.ref ? "bg-cream" : ""
                }`}
              >
                <td className="px-5 py-4 text-xs font-semibold text-mahogany">
                  {row.ref}
                </td>
                <td className="px-5 py-4 text-sm text-ink">
                  {row.customerName}
                </td>
                <td className="px-5 py-4 text-sm text-[var(--text-muted)]">
                  {roomName(row.roomId)}
                </td>
                <td className="px-5 py-4 text-sm text-[var(--text-muted)]">{row.date}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
              {openRef === row.ref && (
                <tr>
                  <td colSpan={5} className="p-0">
                    <AdminInquiryPanel
                      refId={row.ref}
                      rooms={rooms}
                      addons={addons}
                      onChanged={onChanged}
                      onClose={() => setOpenRef(null)}
                      onPaymentLinkReady={onPaymentLinkReady}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                No inquiries.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
