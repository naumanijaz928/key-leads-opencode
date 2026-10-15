import { ok, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { getLeadFacets } from "@/features/leads/api/queries";

export const GET = withRoute(async () => {
  await requireUser();
  const facets = await getLeadFacets();
  return ok(facets);
});
