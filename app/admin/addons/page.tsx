"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { Alert, Btn, OutlineBtn, Spinner, StatusPill } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { AddOn, EntityStatus } from "@/lib/types";

type Draft = { name: string; description: string; status: EntityStatus };

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<AddOn[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

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

  return (
    <>
      <AdminHeader title="Add-ons">
        <Btn sm onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "+ Add Add-on"}
        </Btn>
      </AdminHeader>
      <div className="px-8 py-8 flex flex-col gap-6">
        {adding && (
          <div className="border border-[#222] bg-white p-6">
            <p className="text-sm font-bold text-[#222] mb-4">New Add-on</p>
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
          <div className="bg-white border border-[#D1D1D1] overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-[#D1D1D1] bg-[#F0F0F0]">
                  {["Name", "Description", "Status"].map((h) => (
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
                {addons.map((a) => (
                  <Fragment key={a.id}>
                    <tr
                      onClick={() => setOpenId(openId === a.id ? null : a.id)}
                      className={`border-b border-[#EBEBEB] cursor-pointer hover:bg-[#F5F5F5] ${
                        openId === a.id ? "bg-[#F0F0F0]" : ""
                      }`}
                    >
                      <td className="px-5 py-4 text-sm font-bold text-[#222]">
                        {a.name}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#666] max-w-md truncate">
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
                    </tr>
                    {openId === a.id && (
                      <tr>
                        <td colSpan={3} className="p-0">
                          <div className="border-t border-[#D1D1D1] bg-[#F7F7F7] p-6">
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
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
          Name
        </span>
        <input
          value={d.name}
          onChange={(e) => setD({ ...d, name: e.target.value })}
          className="border border-[#AAAAAA] bg-white h-10 px-3 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
          Description
        </span>
        <textarea
          value={d.description}
          onChange={(e) => setD({ ...d, description: e.target.value })}
          className="border border-[#AAAAAA] bg-white px-3 py-2 text-sm min-h-[70px]"
        />
      </label>
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
          Status
        </span>
        <button
          onClick={() =>
            setD({ ...d, status: d.status === "Active" ? "Inactive" : "Active" })
          }
        >
          <StatusPill status={d.status} />
        </button>
      </div>
      {err && <Alert>{err}</Alert>}
      <div className="flex gap-2">
        <Btn sm onClick={save} disabled={busy}>
          Save Add-on
        </Btn>
        <OutlineBtn sm onClick={onCancel}>
          Cancel
        </OutlineBtn>
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-xs text-[#a22] underline cursor-pointer ml-auto"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
