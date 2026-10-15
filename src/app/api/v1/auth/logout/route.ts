import { and, desc, eq, isNull } from "drizzle-orm";

import { ok, withRoute } from "@/lib/api/http";
import { recordAudit } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const POST = withRoute(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const [latest] = await db()
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.userId, user.id), isNull(sessions.endedAt)))
      .orderBy(desc(sessions.createdAt))
      .limit(1);

    if (latest) {
      await db()
        .update(sessions)
        .set({ endedAt: new Date() })
        .where(eq(sessions.id, latest.id));
    }

    await recordAudit({ actorId: user.id, action: "auth.logout" });
  }

  await supabase.auth.signOut();

  return ok({ success: true });
});
