import { ok, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { listHideReasons } from "@/features/leads/api/queries";

export const GET = withRoute(async () => {
  await requireUser();
  const items = await listHideReasons();
  return ok({ items });
});
