import { ok, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { listSources } from "@/features/sources/api/queries";

export const GET = withRoute(async () => {
  await requireUser();
  const items = await listSources();
  return ok({ items });
});
