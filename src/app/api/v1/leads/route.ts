import { ok, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { listLeads, type LeadFilters } from "@/features/leads/api/queries";

export const GET = withRoute(async (request) => {
  const user = await requireUser();
  const params = new URL(request.url).searchParams;

  const filters: LeadFilters = {
    q: params.get("q") ?? undefined,
    source: params.get("source") ?? undefined,
    verdict: params.get("verdict") ?? "lead",
    workMode: params.get("workMode") ?? undefined,
    company: params.get("company") ?? undefined,
    pipeline: params.get("pipeline") ?? undefined,
    tech: params.get("tech") ?? undefined,
    scope: (params.get("scope") as LeadFilters["scope"]) ?? "all",
    sort: (params.get("sort") as LeadFilters["sort"]) ?? "recent",
    page: params.get("page") ? Number(params.get("page")) : 1,
    pageSize: params.get("pageSize") ? Number(params.get("pageSize")) : 25,
  };

  const result = await listLeads(user.id, filters);
  return ok(result);
});
