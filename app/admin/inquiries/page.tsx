"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { InquiryTable } from "../page";
import { Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { AddOn, Inquiry, InquiryStatus, Room } from "@/lib/types";

const STATUSES: InquiryStatus[] = [
  "New Inquiry",
  "Awaiting Payment",
  "Payment Submitted",
  "Confirmed",
  "Payment Rejected",
  "Cancelled",
];

interface ListResp {
  items: Inquiry[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [openRef, setOpenRef] = useState<string | null>(null);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    Promise.all([
      api.get<Room[]>("/admin/rooms"),
      api.get<AddOn[]>("/admin/addons"),
    ]).then(([r, a]) => {
      setRooms(r);
      setAddons(a);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (search) qs.set("search", search);
    if (dateFrom) qs.set("dateFrom", dateFrom);
    if (dateTo) qs.set("dateTo", dateTo);
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    const res = await api.get<ListResp>(`/admin/inquiries?${qs.toString()}`);
    setItems(res.items);
    setTotal(res.total);
    setLoading(false);
  }, [status, search, dateFrom, dateTo, page]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <AdminHeader title="Inquiries" />
      <div className="px-8 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="border border-[#AAAAAA] bg-white h-9 px-3 text-xs text-[#444]"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setPage(1);
              setDateFrom(e.target.value);
            }}
            className="border border-[#AAAAAA] bg-white h-9 px-3 text-xs text-[#444]"
          />
          <span className="text-xs text-[#888]">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setPage(1);
              setDateTo(e.target.value);
            }}
            className="border border-[#AAAAAA] bg-white h-9 px-3 text-xs text-[#444]"
          />
          <input
            type="text"
            placeholder="Search name or ref…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="border border-[#AAAAAA] bg-white h-9 px-3 text-xs text-[#444] flex-1 min-w-[200px]"
          />
        </div>

        <div className="bg-white border border-[#D1D1D1]">
          {loading ? (
            <Spinner />
          ) : (
            <InquiryTable
              rows={items}
              rooms={rooms}
              addons={addons}
              openRef={openRef}
              setOpenRef={setOpenRef}
              onChanged={load}
            />
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-[#666]">
          <span>
            {total} inquiries · page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="border border-[#AAAAAA] px-3 py-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="border border-[#AAAAAA] px-3 py-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
