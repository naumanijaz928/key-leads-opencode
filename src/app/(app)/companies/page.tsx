"use client";

import * as React from "react";
import { Building, Search } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useCompanies,
  useCompany,
  useUpdateCompany,
} from "@/features/companies/hooks/use-companies";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Company } from "@/types";

export default function CompaniesPage() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Company | null>(null);
  const debounced = useDebouncedValue(search, 350);

  const companies = useCompanies({ q: debounced || undefined, page });
  const data = companies.data;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Companies"
        description="Companies discovered across your sources, with open-role counts."
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search companies…"
          className="pl-8"
        />
      </div>

      {companies.isLoading && !data ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Open roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sources</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((company) => (
                <TableRow
                  key={company.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(company)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {company.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={company.logoUrl}
                          alt=""
                          className="size-6 rounded-md border border-border object-contain"
                        />
                      ) : (
                        <div className="size-6 rounded-md border border-border bg-muted" />
                      )}
                      <span className="font-medium">{company.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {company.openRoles}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{company.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {company.sources.slice(0, 3).map((source) => (
                        <Badge key={source} variant="muted">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {company.location ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={<Building />}
          title="No companies yet"
          description="Companies appear automatically as leads are collected."
        />
      )}

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setPage(data.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() => setPage(data.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <CompanyDetailDialog
        key={selected?.id ?? "none"}
        company={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function CompanyDetailDialog({
  company,
  onOpenChange,
}: {
  company: Company | null;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = useCompany(company?.id ?? null);
  const update = useUpdateCompany();
  const [status, setStatus] = React.useState(company?.status ?? "new");
  const [notes, setNotes] = React.useState(company?.notes ?? "");

  const current = detail.data?.company ?? company;

  return (
    <Dialog open={Boolean(company)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {current ? (
          <>
            <DialogHeader>
              <DialogTitle>{current.name}</DialogTitle>
              <DialogDescription>
                {current.openRoles} open roles · {current.sources.join(", ") || "—"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="company-status">Status</Label>
                <Input
                  id="company-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                />
              </div>
              {current.website ? (
                <div className="grid gap-1.5">
                  <Label>Website</Label>
                  <a
                    href={current.website}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm text-primary hover:underline"
                  >
                    {current.website}
                  </a>
                </div>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="company-notes">Notes</Label>
              <Textarea
                id="company-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={() =>
                update.mutate(
                  { id: current.id, status, notes },
                  {
                    onSuccess: () => toast.success("Company updated"),
                    onError: (error) => toast.error(error.message),
                  },
                )
              }
              disabled={update.isPending}
            >
              Save changes
            </Button>

            {detail.data?.leads.length ? (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Open leads</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {detail.data.leads.map((lead) => (
                      <li key={lead.id} className="flex justify-between gap-2">
                        <span className="truncate">{lead.title}</span>
                        <Badge variant="muted">{lead.source}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
