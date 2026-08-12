"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useState,
} from "react";
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
          <Icon name={adding ? "close" : "plus"} className="w-3.5 h-3.5" />
          {adding ? "Cancel" : "Add room"}
        </Btn>
      </AdminHeader>
      <div className="px-8 py-8 flex flex-col gap-6">
        {adding && (
          <div className="bg-white border border-[var(--surface-border)] p-7">
            <p className="font-display text-lg text-ink mb-5">New room</p>
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
          <div className="bg-white border border-[var(--surface-border)] overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--surface-border)] bg-cream">
                  {["Room", "Capacity", "Area", "Status", ""].map((h) => (
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
                {rooms.map((room) => (
                  <Fragment key={room.id}>
                    <tr
                      onClick={() => setOpenId(openId === room.id ? null : room.id)}
                      className={`border-b border-[var(--surface-border)] cursor-pointer hover:bg-cream/60 transition-colors ${
                        openId === room.id ? "bg-cream" : ""
                      }`}
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-ink">
                        {room.name || "[ Unnamed ]"}
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--text-muted)]">
                        {room.capacity}
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--text-muted)]">
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
                      <td className="px-5 py-4 text-right">
                        <Icon name="pencil" className="w-4 h-4 text-[var(--text-muted)] inline-block" />
                      </td>
                    </tr>
                    {openId === room.id && (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <div className="border-t border-[var(--surface-border)] bg-cream p-7">
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
                {rooms.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                      No rooms yet.
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
        <TextField
          label="Room name"
          placeholder="e.g. Grand Ballroom"
          required
          value={d.name}
          onChange={(e) => setD({ ...d, name: e.target.value })}
        />
        <TextField
          label="Capacity"
          placeholder="e.g. 500 pax"
          value={d.capacity}
          onChange={(e) => setD({ ...d, capacity: e.target.value })}
        />
        <TextField
          label="Area"
          placeholder="e.g. 1,200 sqm"
          value={d.area}
          onChange={(e) => setD({ ...d, area: e.target.value })}
        />
      </div>
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
      <TextArea
        label="Description"
        value={d.description}
        onChange={(e) => setD({ ...d, description: e.target.value })}
        placeholder="Describe the room, its features, and ideal use cases…"
        className="min-h-[70px]"
      />

      {/* Facilities */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
          Facilities
        </span>
        <div className="flex flex-wrap gap-2">
          {d.facilities.map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 border border-[var(--surface-border)] bg-white px-2.5 py-1 text-xs text-ink"
            >
              {f}
              <button
                onClick={() =>
                  setD({ ...d, facilities: d.facilities.filter((_, idx) => idx !== i) })
                }
                className="text-[var(--text-muted)] hover:text-danger cursor-pointer"
                aria-label={`Remove ${f}`}
              >
                <Icon name="close" className="w-3 h-3" />
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
            className="flex-1 border border-[var(--field-border)] bg-[var(--field-bg)] h-11 px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--field-placeholder)] outline-none focus:border-gold transition-colors duration-150"
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
            <Icon name="plus" className="w-3.5 h-3.5" />
            Add
          </OutlineBtn>
        </div>
      </div>

      {/* Specs */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
          Production specs
        </span>
        <div className="border border-[var(--surface-border)] bg-white">
          {d.specs.map((s, i) => (
            <div
              key={s.system}
              className="flex items-center gap-3 border-b border-[var(--surface-border)] last:border-0 px-4 py-2.5"
            >
              <span className="text-xs font-semibold text-ink w-36 flex-shrink-0">
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
                className="flex-1 border border-[var(--field-border)] bg-[var(--field-bg)] text-xs text-[var(--text-primary)] placeholder:text-[var(--field-placeholder)] px-3 py-1.5 outline-none focus:border-gold transition-colors duration-150"
              />
            </div>
          ))}
        </div>
      </div>

      {err && <Alert>{err}</Alert>}
      <div className="flex items-center gap-2">
        <Btn sm onClick={save} disabled={busy || !d.name.trim()}>
          Save room
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
