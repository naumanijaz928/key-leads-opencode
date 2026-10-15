import { ok, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { listCompanies } from "@/features/companies/api/queries";

export const GET = withRoute(async (request) => {
  await requireUser();
  const params = new URL(request.url).searchParams;

  const result = await listCompanies({
    q: params.get("q") ?? undefined,
    status: params.get("status") ?? undefined,
    page: params.get("page") ? Number(params.get("page")) : 1,
    pageSize: params.get("pageSize") ? Number(params.get("pageSize")) : 25,
  });

  return ok(result);
});
