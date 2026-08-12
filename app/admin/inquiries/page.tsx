"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { InquiryTable } from "../page";
import { Icon, OutlineBtn, Select, Spinner, TextField } from "@/components/ui";
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
      <div className="px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        <div className="bg-white border border-[var(--surface-border)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Icon name="filter" className="w-4 h-4 text-gold-dim" />
            <p className="text-xs font-semibold text-ink uppercase tracking-wide">
              Filters
            </p>
          </div>
          <div className="flex items-end gap-4 flex-wrap">
            <Select
              label="Status"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="w-48"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <TextField
              label="From"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setPage(1);
                setDateFrom(e.target.value);
              }}
              className="w-40"
            />
            <TextField
              label="To"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setPage(1);
                setDateTo(e.target.value);
              }}
              className="w-40"
            />
            <TextField
              label="Search"
              type="text"
              placeholder="Search name or ref…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="flex-1 min-w-[200px]"
            />
          </div>
        </div>

        <div className="bg-white border border-[var(--surface-border)]">
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

        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            {total} inquiries · page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <OutlineBtn sm disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </OutlineBtn>
            <OutlineBtn sm disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </OutlineBtn>
          </div>
        </div>
      </div>
    </>
  );
}
