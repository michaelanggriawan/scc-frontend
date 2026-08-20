import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/ui";

export function AdminHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="bg-[var(--surface-raised)] border-b border-[var(--surface-border)] min-h-20 flex flex-wrap items-center px-4 md:px-8 gap-x-4 gap-y-3 py-3">
      <h1 className="font-display text-xl md:text-2xl text-ink flex-1 min-w-0">{title}</h1>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      {user && (
        <div className="flex items-center gap-3 ml-auto">
          <Link
            href="/profile"
            className="flex items-center gap-2 border border-[var(--surface-border-strong)] bg-transparent px-3.5 py-2 text-xs font-semibold text-ink hover:border-gold transition-colors"
          >
            <Icon name="user" className="w-4 h-4 text-gold-dim" />
            {user.fullName || user.email}
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="text-xs text-ink/50 hover:text-mahogany cursor-pointer transition-colors"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
