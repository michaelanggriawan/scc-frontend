import { ReactNode } from "react";

export function AdminHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-white border-b border-[#D1D1D1] min-h-16 flex items-center px-8 gap-4 py-3">
      <h1 className="text-base font-bold text-[#222] flex-1">{title}</h1>
      {children}
    </div>
  );
}
