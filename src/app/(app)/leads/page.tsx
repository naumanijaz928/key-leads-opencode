"use client";

import * as React from "react";
import { Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HideLeadDialog } from "@/features/leads/components/hide-lead-dialog";
import { LeadDetailDialog } from "@/features/leads/components/lead-detail";
import { LeadsTable } from "@/features/leads/components/leads-table";
import { LeadsToolbar } from "@/features/leads/components/leads-toolbar";
import {
  useApplyLead,
  useHideLead,
  useLeadFacets,
  useLeads,
  useMarkViewed,
  useUnapplyLead,
  useUnhideLead,
} from "@/features/leads/hooks/use-leads";
import type { LeadFilters } from "@/features/leads/api/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Lead } from "@/types";

export default function LeadsPage() {
  const [filters, setFilters] = React.useState<LeadFilters>({
    verdict: "lead",
    scope: "all",
    sort: "recent",
    page: 1,
    pageSize: 25,
  });
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [hideTarget, setHideTarget] = React.useState<Lead | null>(null);

  const debouncedSearch = useDebouncedValue(search, 350);
  const leads = useLeads({ ...filters, q: debouncedSearch || undefined });
  const facets = useLeadFacets();

  const markViewed = useMarkViewed();
  const applyLead = useApplyLead();
  const unapplyLead = useUnapplyLead();
  const hideLead = useHideLead();
  const unhideLead = useUnhideLead();

  function patch(next: Partial<LeadFilters>) {
    setFilters((prev) => ({ ...prev, ...next }));
  }

  function openDetail(lead: Lead) {
    setSelected(lead);
    setDetailOpen(true);
    if (!lead.viewed) {
      markViewed.mutate(lead.id);
    }
  }

  function handleApply(lead: Lead) {
    applyLead.mutate(lead.id, {
      onSuccess: () => toast.success("Marked as applied"),
      onError: (error) => toast.error(error.message),
    });
  }

  function handleUnapply(lead: Lead) {
    unapplyLead.mutate(lead.id, {
      onSuccess: () => toast.success("Application removed"),
      onError: (error) => toast.error(error.message),
    });
  }

  function handleHide(lead: Lead, reason: string, note?: string) {
    hideLead.mutate(
      { id: lead.id, reason, note },
      {
        onSuccess: () => toast.success("Lead hidden"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleUnhide(lead: Lead) {
    unhideLead.mutate(lead.id, {
      onSuccess: () => toast.success("Lead restored"),
      onError: (error) => toast.error(error.message),
    });
  }

  const data = leads.data;
  const showSkeleton = leads.isLoading && !data;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Leads"
        description="Triage remote roles collected from every connected source."
        actions={
          <Button variant="outline" className="tabular-nums">
            {data?.total ?? 0} leads
          </Button>
        }
      />

      <div className="pb-4">
        <LeadsToolbar
          filters={filters}
          onChange={patch}
          facets={facets.data}
          search={search}
          onSearch={setSearch}
        />
      </div>

      {showSkeleton ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <LeadsTable
            leads={data.items}
            onSelect={openDetail}
            onApply={handleApply}
            onUnapply={handleUnapply}
            onHide={setHideTarget}
            onUnhide={handleUnhide}
          />

          {data.totalPages > 1 ? (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() => patch({ page: data.page - 1 })}
                >
                  <ChevronLeft />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page >= data.totalPages}
                  onClick={() => patch({ page: data.page + 1 })}
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={<Briefcase />}
          title="No leads found"
          description="Adjust your filters, or start a run to collect fresh leads from your sources."
        />
      )}

      <LeadDetailDialog
        lead={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onApply={handleApply}
        onUnapply={handleUnapply}
        onHide={handleHide}
        onUnhide={handleUnhide}
      />

      <HideLeadDialog
        lead={hideTarget}
        open={Boolean(hideTarget)}
        onOpenChange={(open) => !open && setHideTarget(null)}
        onConfirm={handleHide}
      />
    </div>
  );
}
