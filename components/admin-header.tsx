import { ReactNode } from "react";

export function AdminHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-[var(--surface-raised)] border-b border-[var(--surface-border)] min-h-20 flex flex-wrap items-center px-4 md:px-8 gap-x-4 gap-y-3 py-3">
      <h1 className="font-display text-xl md:text-2xl text-ink flex-1 min-w-0">{title}</h1>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
