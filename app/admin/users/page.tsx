"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);

  useEffect(() => {
    api.get<User[]>("/admin/users").then(setUsers);
  }, []);

  if (!users)
    return (
      <>
        <AdminHeader title="Users" />
        <Spinner label="Loading users…" />
      </>
    );

  return (
    <>
      <AdminHeader title="Users" />
      <div className="px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        <div className="bg-white border border-[var(--surface-border)]">
          <UsersTable rows={users} />
        </div>
      </div>
    </>
  );
}

function UsersTable({ rows }: { rows: User[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="border-b border-[var(--surface-border)] bg-cream">
            {["Email", "Full Name", "Phone", "Company", "Role", "Joined"].map((h) => (
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
            <tr
              key={row.id}
              className="border-b border-[var(--surface-border)] last:border-b-0"
            >
              <td className="px-5 py-4 text-sm text-ink">{row.email}</td>
              <td className="px-5 py-4 text-sm text-[var(--text-muted)]">
                {row.fullName || "—"}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--text-muted)]">
                {row.phone || "—"}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--text-muted)]">
                {row.company || "—"}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--text-muted)] capitalize">
                {row.role}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--text-muted)]">
                {new Date(row.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                No users.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
