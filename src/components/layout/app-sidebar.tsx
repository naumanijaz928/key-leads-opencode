"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/layout/logo";
import { visibleNavGroups } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { Role, SessionUser } from "@/types";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  user,
  onNavigate,
  className,
}: {
  user: SessionUser;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const groups = visibleNavGroups(user.role as Role);

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Logo />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto scrollbar-thin px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <p className="truncate text-sm font-medium">
            {user.teamName ?? "No team"}
          </p>
          <p className="text-xs capitalize text-muted-foreground">
            {user.role.replace("_", " ")}
          </p>
        </div>
      </div>
    </aside>
  );
}
