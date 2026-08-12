import { ReactNode } from "react";

export function AdminHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-[var(--surface-raised)] border-b border-[var(--surface-border)] min-h-20 flex items-center px-8 gap-4 py-3">
      <h1 className="font-display text-2xl text-ink flex-1">{title}</h1>
      {children}
    </div>
  );
}
