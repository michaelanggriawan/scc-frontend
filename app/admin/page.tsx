"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { AdminInquiryPanel } from "@/components/admin-inquiry-panel";
import { StatusBadge, Spinner } from "@/components/ui";
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

  if (!stats || !chart) return <Spinner label="Loading dashboard…" />;

  const max = Math.max(1, ...chart.series.map((s) => s.count));

  const cards = [
    ["Total Inquiries", stats.totalInquiries],
    ["Awaiting Payment", stats.awaitingPayment],
    ["Confirmed", stats.confirmed],
    ["Active Rooms", stats.activeRooms],
  ] as const;

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="px-8 py-8 flex flex-col gap-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map(([label, value]) => (
            <div key={label} className="bg-white border border-[#D1D1D1] px-6 py-5">
              <p className="text-xs text-[#888] mb-2">{label}</p>
              <p className="text-3xl font-bold text-[#222]">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#D1D1D1] p-6">
          <p className="text-sm font-bold text-[#222] mb-6">
            Inquiries Over Time ({chart.year})
          </p>
          <div className="flex items-end gap-3 h-48 border-b border-l border-[#D1D1D1] px-2">
            {chart.series.map((s) => (
              <div key={s.month} className="flex-1 flex items-end" title={`${s.month}: ${s.count}`}>
                <div
                  className="w-full bg-[#AAAAAA]"
                  style={{ height: `${(s.count / max) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-1 px-2">
            {chart.series.map((s) => (
              <div key={s.month} className="flex-1 text-center text-[9px] text-[#999]">
                {s.month}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#D1D1D1]">
          <div className="px-6 py-4 border-b border-[#D1D1D1]">
            <p className="text-sm font-bold text-[#222]">Recent Inquiries</p>
          </div>
          <InquiryTable
            rows={recent}
            rooms={rooms}
            addons={addons}
            openRef={openRef}
            setOpenRef={setOpenRef}
            onChanged={load}
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
}: {
  rows: Inquiry[];
  rooms: Room[];
  addons: AddOn[];
  openRef: string | null;
  setOpenRef: (r: string | null) => void;
  onChanged: () => void;
}) {
  const roomName = (id: string | null) =>
    rooms.find((r) => r.id === id)?.name ?? "—";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="border-b border-[#D1D1D1] bg-[#F0F0F0]">
            {["Ref", "Customer", "Room", "Date", "Status"].map((h) => (
              <th
                key={h}
                className="text-left text-[10px] font-semibold text-[#666] uppercase tracking-wider px-5 py-3"
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
                className={`border-b border-[#EBEBEB] cursor-pointer hover:bg-[#F5F5F5] ${
                  openRef === row.ref ? "bg-[#F0F0F0]" : ""
                }`}
              >
                <td className="px-5 py-4 text-xs font-bold text-[#222]">
                  {row.ref}
                </td>
                <td className="px-5 py-4 text-sm text-[#444]">
                  {row.customerName}
                </td>
                <td className="px-5 py-4 text-sm text-[#888]">
                  {roomName(row.roomId)}
                </td>
                <td className="px-5 py-4 text-sm text-[#888]">{row.date}</td>
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
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#AAAAAA]">
                No inquiries.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
