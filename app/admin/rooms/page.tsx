"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  type InputHTMLAttributes,
} from "react";
import { AdminHeader } from "@/components/admin-header";
import { Alert, Btn, OutlineBtn, Spinner, StatusPill } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { EntityStatus, Room, RoomSpec } from "@/lib/types";

const SPEC_SYSTEMS = [
  "LED Display",
  "Sound System",
  "Rigging",
  "Lighting",
  "Power Supply",
  "Connectivity",
  "IMAG / Projection",
  "Communication",
];

type Draft = {
  name: string;
  capacity: string;
  area: string;
  status: EntityStatus;
  description: string;
  facilities: string[];
  specs: RoomSpec[];
};

function blank(): Draft {
  return {
    name: "",
    capacity: "",
    area: "",
    status: "Active",
    description: "",
    facilities: [],
    specs: SPEC_SYSTEMS.map((system) => ({ system, spec: "" })),
  };
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setRooms(await api.get<Room[]>("/admin/rooms"));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(r: Room) {
    await api.patch(`/admin/rooms/${r.id}/status`, {
      status: r.status === "Active" ? "Inactive" : "Active",
    });
    load();
  }
  async function remove(id: string) {
    await api.del(`/admin/rooms/${id}`);
    setOpenId(null);
    load();
  }

  return (
    <>
      <AdminHeader title="Rooms">
        <Btn sm onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "+ Add Room"}
        </Btn>
      </AdminHeader>
      <div className="px-8 py-8 flex flex-col gap-6">
        {adding && (
          <div className="border border-[#222] bg-white p-6">
            <p className="text-sm font-bold text-[#222] mb-4">New Room</p>
            <RoomForm
              initial={blank()}
              onSave={async (d) => {
                await api.post("/admin/rooms", d);
                setAdding(false);
                load();
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {rooms === null ? (
          <Spinner />
        ) : (
          <div className="bg-white border border-[#D1D1D1] overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-[#D1D1D1] bg-[#F0F0F0]">
                  {["Room", "Capacity", "Area", "Status"].map((h) => (
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
                {rooms.map((room) => (
                  <Fragment key={room.id}>
                    <tr
                      onClick={() => setOpenId(openId === room.id ? null : room.id)}
                      className={`border-b border-[#EBEBEB] cursor-pointer hover:bg-[#F5F5F5] ${
                        openId === room.id ? "bg-[#F0F0F0]" : ""
                      }`}
                    >
                      <td className="px-5 py-4 text-sm font-bold text-[#222]">
                        {room.name || "[ Unnamed ]"}
                      </td>
                      <td className="px-5 py-4 text-sm text-[#444]">
                        {room.capacity}
                      </td>
                      <td className="px-5 py-4 text-sm text-[#444]">
                        {room.area}
                      </td>
                      <td
                        className="px-5 py-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(room);
                        }}
                      >
                        <button className="cursor-pointer">
                          <StatusPill status={room.status} />
                        </button>
                      </td>
                    </tr>
                    {openId === room.id && (
                      <tr>
                        <td colSpan={4} className="p-0">
                          <div className="border-t border-[#D1D1D1] bg-[#F7F7F7] p-6">
                            <RoomForm
                              initial={room}
                              onSave={async (d) => {
                                await api.patch(`/admin/rooms/${room.id}`, d);
                                setOpenId(null);
                                load();
                              }}
                              onCancel={() => setOpenId(null)}
                              onDelete={() => remove(room.id)}
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

function RoomForm({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: Draft | Room;
  onSave: (d: Draft) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [d, setD] = useState<Draft>({
    name: initial.name,
    capacity: initial.capacity,
    area: initial.area,
    status: initial.status,
    description: initial.description,
    facilities: initial.facilities ?? [],
    specs:
      initial.specs?.length
        ? initial.specs
        : SPEC_SYSTEMS.map((system) => ({ system, spec: "" })),
  });
  const [facilityDraft, setFacilityDraft] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setErr("");
    if (!d.name.trim()) {
      setErr("Room name is required.");
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
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field
          label="Room Name"
          placeholder="e.g. Grand Ballroom"
          required
          value={d.name}
          onChange={(v) => setD({ ...d, name: v })}
        />
        <Field
          label="Capacity"
          placeholder="e.g. 500 pax"
          value={d.capacity}
          onChange={(v) => setD({ ...d, capacity: v })}
        />
        <Field
          label="Area"
          placeholder="e.g. 1,200 sqm"
          value={d.area}
          onChange={(v) => setD({ ...d, area: v })}
        />
      </div>
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
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
          Description
        </span>
        <textarea
          value={d.description}
          onChange={(e) => setD({ ...d, description: e.target.value })}
          placeholder="Describe the room, its features, and ideal use cases…"
          className="border border-[#AAAAAA] bg-white px-3 py-2 text-sm min-h-[70px]"
        />
      </label>

      {/* Facilities */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
          Facilities
        </span>
        <div className="flex flex-wrap gap-2">
          {d.facilities.map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-1 border border-[#D1D1D1] bg-white px-2 py-1 text-xs"
            >
              {f}
              <button
                onClick={() =>
                  setD({ ...d, facilities: d.facilities.filter((_, idx) => idx !== i) })
                }
                className="text-[#888] cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={facilityDraft}
            onChange={(e) => setFacilityDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (facilityDraft.trim()) {
                  setD({ ...d, facilities: [...d.facilities, facilityDraft.trim()] });
                  setFacilityDraft("");
                }
              }
            }}
            placeholder="Add a facility…"
            className="flex-1 border border-[#AAAAAA] bg-white h-9 px-3 text-sm"
          />
          <OutlineBtn
            sm
            onClick={() => {
              if (facilityDraft.trim()) {
                setD({ ...d, facilities: [...d.facilities, facilityDraft.trim()] });
                setFacilityDraft("");
              }
            }}
          >
            Add
          </OutlineBtn>
        </div>
      </div>

      {/* Specs */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
          Production Specs
        </span>
        <div className="border border-[#D1D1D1] bg-white">
          {d.specs.map((s, i) => (
            <div
              key={s.system}
              className="flex items-center gap-2 border-b border-[#EBEBEB] last:border-0 px-3 py-2"
            >
              <span className="text-xs font-bold text-[#333] w-36 flex-shrink-0">
                {s.system}
              </span>
              <input
                value={s.spec}
                onChange={(e) =>
                  setD({
                    ...d,
                    specs: d.specs.map((sp, idx) =>
                      idx === i ? { ...sp, spec: e.target.value } : sp,
                    ),
                  })
                }
                placeholder="Specification…"
                className="flex-1 border border-[#EBEBEB] bg-white text-xs px-2 py-1"
              />
            </div>
          ))}
        </div>
      </div>

      {err && <Alert>{err}</Alert>}
      <div className="flex gap-2">
        <Btn sm onClick={save} disabled={busy || !d.name.trim()}>
          Save Room
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

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-[#444] uppercase tracking-wide">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
        className="border border-[#AAAAAA] bg-white h-10 px-3 text-sm"
      />
    </label>
  );
}
