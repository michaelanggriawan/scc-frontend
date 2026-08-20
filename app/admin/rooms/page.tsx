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
import { api, ApiError, fileUrl } from "@/lib/api";
import { isValidUploadSize, MAX_UPLOAD_MB } from "@/lib/validation";
import type { EntityStatus, Room, RoomSpec } from "@/lib/types";

type Draft = {
  name: string;
  capacity: string;
  area: string;
  status: EntityStatus;
  description: string;
  facilities: string[];
  specs: RoomSpec[];
  photos: string[];
};

function blank(): Draft {
  return {
    name: "",
    capacity: "",
    area: "",
    status: "Active",
    description: "",
    facilities: [],
    specs: [],
    photos: [],
  };
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  // Rooms that have been opened at least once stay mounted (just collapsed)
  // so re-closing them animates shut instead of vanishing.
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());
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
      <div className="px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6">
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
                      onClick={() => {
                        const willOpen = openId !== room.id;
                        setOpenId(willOpen ? room.id : null);
                        if (willOpen)
                          setOpenedIds((s) => new Set(s).add(room.id));
                      }}
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
                    <tr>
                      <td colSpan={5} className="p-0">
                        <div
                          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                            openId === room.id ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          }`}
                        >
                          <div className="overflow-hidden">
                            {openedIds.has(room.id) && (
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
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
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
    specs: initial.specs ?? [],
    photos: initial.photos ?? [],
  });
  const [facilityDraft, setFacilityDraft] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoErr, setPhotoErr] = useState("");

  async function uploadPhotos(files: FileList) {
    setPhotoErr("");
    for (const file of Array.from(files)) {
      if (!isValidUploadSize(file)) {
        setPhotoErr(`Each photo must be ${MAX_UPLOAD_MB} MB or smaller.`);
        continue;
      }
      setUploadingPhoto(true);
      try {
        const res = await api.upload<{ fileUrl: string }>(
          "/admin/uploads/room-photo",
          file,
        );
        setD((prev) => ({ ...prev, photos: [...prev.photos, res.fileUrl] }));
      } catch (e) {
        setPhotoErr(e instanceof ApiError ? e.message : "Upload failed.");
      } finally {
        setUploadingPhoto(false);
      }
    }
  }

  function removePhoto(url: string) {
    setD((prev) => ({ ...prev, photos: prev.photos.filter((p) => p !== url) }));
  }
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function updateSpec(i: number, patch: Partial<RoomSpec>) {
    setD((prev) => ({
      ...prev,
      specs: prev.specs.map((sp, idx) => (idx === i ? { ...sp, ...patch } : sp)),
    }));
  }

  function removeSpec(i: number) {
    setD((prev) => ({ ...prev, specs: prev.specs.filter((_, idx) => idx !== i) }));
  }

  function addSpec() {
    setD((prev) => ({ ...prev, specs: [...prev.specs, { system: "", spec: "" }] }));
  }

  function reorderSpecs(from: number, to: number) {
    if (from === to) return;
    setD((prev) => {
      const specs = [...prev.specs];
      const [moved] = specs.splice(from, 1);
      specs.splice(to, 0, moved);
      return { ...prev, specs };
    });
  }

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

      {/* Photos */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
          Photos
        </span>
        {d.photos.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {d.photos.map((url) => (
              <div
                key={url}
                className="relative w-24 h-24 flex-shrink-0 border border-[var(--surface-border)] bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl(url)}
                  alt="Room photo"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(url)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center cursor-pointer"
                  aria-label="Remove photo"
                >
                  <Icon name="close" className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="flex items-center gap-2 border border-dashed border-[var(--field-border)] px-4 py-3 text-xs text-[var(--text-muted)] cursor-pointer hover:border-gold transition-colors w-fit">
          <Icon name="upload" className="w-4 h-4 text-gold flex-shrink-0" />
          {uploadingPhoto ? "Uploading…" : `Upload photos · Max ${MAX_UPLOAD_MB} MB each`}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) uploadPhotos(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {photoErr && <Alert>{photoErr}</Alert>}
      </div>

      {/* Specs */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
          Production specs
        </span>
        <div className="border border-[var(--surface-border)] bg-white">
          {d.specs.map((s, i) => (
            <div
              key={i}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragIndex !== null && overIndex !== i) setOverIndex(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) reorderSpecs(dragIndex, i);
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`flex items-center gap-2 border-b border-[var(--surface-border)] last:border-0 px-3 py-2 ${
                dragIndex === i ? "opacity-40" : ""
              } ${overIndex === i && dragIndex !== i ? "border-t-2 border-t-gold" : ""}`}
            >
              <div
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.effectAllowed = "move";
                  setDragIndex(i);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className="flex items-center justify-center text-[var(--text-muted)] hover:text-ink cursor-grab active:cursor-grabbing flex-shrink-0"
                title="Drag to reorder"
              >
                <Icon name="gripVertical" className="w-4 h-4" />
              </div>
              <input
                value={s.system}
                onChange={(e) => updateSpec(i, { system: e.target.value })}
                placeholder="System…"
                className="w-36 flex-shrink-0 border border-[var(--field-border)] bg-[var(--field-bg)] text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--field-placeholder)] px-3 py-1.5 outline-none focus:border-gold transition-colors duration-150"
              />
              <input
                value={s.spec}
                onChange={(e) => updateSpec(i, { spec: e.target.value })}
                placeholder="Specification…"
                className="flex-1 border border-[var(--field-border)] bg-[var(--field-bg)] text-xs text-[var(--text-primary)] placeholder:text-[var(--field-placeholder)] px-3 py-1.5 outline-none focus:border-gold transition-colors duration-150"
              />
              <button
                onClick={() => removeSpec(i)}
                className="text-[var(--text-muted)] hover:text-danger cursor-pointer flex-shrink-0"
                aria-label="Remove spec row"
              >
                <Icon name="close" className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {d.specs.length === 0 && (
            <div className="px-4 py-3 text-xs text-[var(--text-muted)]">
              No specs yet.
            </div>
          )}
        </div>
        <OutlineBtn sm onClick={addSpec} className="self-start">
          <Icon name="plus" className="w-3.5 h-3.5" />
          Add row
        </OutlineBtn>
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
