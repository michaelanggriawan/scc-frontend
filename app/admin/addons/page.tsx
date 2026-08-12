"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import {
  Alert,
  Btn,
  Icon,
  OutlineBtn,
  Spinner,
  StatusPill,
  TextArea,
  TextField,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { AddOn, EntityStatus } from "@/lib/types";

type Draft = { name: string; description: string; status: EntityStatus };

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<AddOn[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    setAddons(await api.get<AddOn[]>("/admin/addons"));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(a: AddOn) {
    await api.patch(`/admin/addons/${a.id}/status`, {
      status: a.status === "Active" ? "Inactive" : "Active",
    });
    load();
  }

  async function reorder(from: number, to: number) {
    if (!addons || from === to) return;
    const reordered = [...addons];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setAddons(reordered);
    await api.patch("/admin/addons/reorder", {
      ids: reordered.map((a) => a.id),
    });
    load();
  }

  return (
    <>
      <AdminHeader title="Add-ons">
        <Btn sm onClick={() => setAdding((v) => !v)}>
          <Icon name={adding ? "close" : "plus"} className="w-3.5 h-3.5" />
          {adding ? "Cancel" : "Add add-on"}
        </Btn>
      </AdminHeader>
      <div className="px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        {adding && (
          <div className="bg-white border border-[var(--surface-border)] p-7">
            <p className="font-display text-lg text-ink mb-5">New add-on</p>
            <AddonForm
              initial={{ name: "", description: "", status: "Active" }}
              onSave={async (d) => {
                await api.post("/admin/addons", d);
                setAdding(false);
                load();
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {addons === null ? (
          <Spinner />
        ) : (
          <div className="bg-white border border-[var(--surface-border)] overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-[var(--surface-border)] bg-cream">
                  {["", "Name", "Description", "Status", ""].map((h, i) => (
                    <th
                      key={i}
                      className="text-left text-[10px] font-semibold text-gold-dim uppercase tracking-wider px-5 py-3.5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {addons.map((a, idx) => (
                  <Fragment key={a.id}>
                    <tr
                      onClick={() => setOpenId(openId === a.id ? null : a.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragIndex !== null && overIndex !== idx) setOverIndex(idx);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragIndex !== null) reorder(dragIndex, idx);
                        setDragIndex(null);
                        setOverIndex(null);
                      }}
                      className={`border-b border-[var(--surface-border)] cursor-pointer hover:bg-cream/60 transition-colors ${
                        openId === a.id ? "bg-cream" : ""
                      } ${dragIndex === idx ? "opacity-40" : ""} ${
                        overIndex === idx && dragIndex !== idx
                          ? "border-t-2 border-t-gold"
                          : ""
                      }`}
                    >
                      <td
                        className="px-3 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.effectAllowed = "move";
                            setDragIndex(idx);
                          }}
                          onDragEnd={() => {
                            setDragIndex(null);
                            setOverIndex(null);
                          }}
                          className="flex items-center justify-center text-[var(--text-muted)] hover:text-ink cursor-grab active:cursor-grabbing"
                          title="Drag to reorder"
                        >
                          <Icon name="gripVertical" className="w-4 h-4" />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-ink">
                        {a.name}
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--text-muted)] max-w-md truncate">
                        {a.description}
                      </td>
                      <td
                        className="px-5 py-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(a);
                        }}
                      >
                        <button className="cursor-pointer">
                          <StatusPill status={a.status} />
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Icon name="pencil" className="w-4 h-4 text-[var(--text-muted)] inline-block" />
                      </td>
                    </tr>
                    {openId === a.id && (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <div className="border-t border-[var(--surface-border)] bg-cream p-7">
                            <AddonForm
                              initial={a}
                              onSave={async (d) => {
                                await api.patch(`/admin/addons/${a.id}`, d);
                                setOpenId(null);
                                load();
                              }}
                              onCancel={() => setOpenId(null)}
                              onDelete={async () => {
                                await api.del(`/admin/addons/${a.id}`);
                                setOpenId(null);
                                load();
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {addons.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                      No add-ons yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function AddonForm({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: Draft | AddOn;
  onSave: (d: Draft) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [d, setD] = useState<Draft>({
    name: initial.name,
    description: initial.description,
    status: initial.status,
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setErr("");
    if (!d.name.trim()) {
      setErr("Add-on name is required.");
      return;
    }
    setBusy(true);
    try {
      await onSave(d);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <TextField
        label="Name"
        value={d.name}
        onChange={(e) => setD({ ...d, name: e.target.value })}
        placeholder="e.g. Extra LED Wall"
        required
      />
      <TextArea
        label="Description"
        value={d.description}
        onChange={(e) => setD({ ...d, description: e.target.value })}
        placeholder="Describe what's included…"
        className="min-h-[70px]"
      />
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
          Status
        </span>
        <button
          className="cursor-pointer"
          onClick={() =>
            setD({ ...d, status: d.status === "Active" ? "Inactive" : "Active" })
          }
        >
          <StatusPill status={d.status} />
        </button>
      </div>
      {err && <Alert>{err}</Alert>}
      <div className="flex items-center gap-2">
        <Btn sm onClick={save} disabled={busy || !d.name.trim()}>
          Save add-on
        </Btn>
        <OutlineBtn sm onClick={onCancel}>
          Cancel
        </OutlineBtn>
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs text-danger hover:underline cursor-pointer ml-auto"
          >
            <Icon name="trash" className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
