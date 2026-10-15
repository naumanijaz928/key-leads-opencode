import { redirect } from "next/navigation";

import { SetupNotice } from "@/components/common/setup-notice";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "pending") {
    redirect("/pending");
  }

  if (user.status === "suspended") {
    redirect("/login?error=suspended");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
