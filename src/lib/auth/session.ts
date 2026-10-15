import { cache } from "react";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles, teams } from "@/lib/db/schema";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileStatus, Role, SessionUser } from "@/types";

export async function loadSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const rows = await db()
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      role: profiles.role,
      status: profiles.status,
      teamId: profiles.teamId,
      teamName: teams.name,
    })
    .from(profiles)
    .leftJoin(teams, eq(profiles.teamId, teams.id))
    .where(eq(profiles.id, user.id))
    .limit(1);

  const profile = rows[0];

  if (!profile) {
    return {
      id: user.id,
      email: user.email ?? null,
      fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
      avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      role: "member",
      status: "pending",
      teamId: null,
      teamName: null,
    };
  }

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? null,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
    role: (profile.role as Role) ?? "member",
    status: (profile.status as ProfileStatus) ?? "active",
    teamId: profile.teamId,
    teamName: profile.teamName ?? null,
  };
}

export const getSessionUser = cache(loadSessionUser);

export function isSuperAdmin(user: SessionUser | null) {
  return user?.role === "super_admin";
}

export function canManage(user: SessionUser | null) {
  return user?.role === "super_admin" || user?.role === "team_admin";
}
