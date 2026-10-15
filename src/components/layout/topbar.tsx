"use client";

import Link from "next/link";
import { Menu, Play, Search } from "lucide-react";

import { ThemeToggle } from "@/components/common/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/types";

export function Topbar({
  user,
  onOpenSidebar,
}: {
  user: SessionUser;
  onOpenSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation"
        onClick={onOpenSidebar}
      >
        <Menu />
      </Button>

      <div className="relative hidden max-w-sm flex-1 items-center sm:flex">
        <Search className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
        <Button
          variant="outline"
          className="w-full justify-start pl-8 font-normal text-muted-foreground"
          asChild
        >
          <Link href="/leads">Search leads…</Link>
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button asChild size="sm">
          <Link href="/runs">
            <Play />
            Find leads
          </Link>
        </Button>
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
