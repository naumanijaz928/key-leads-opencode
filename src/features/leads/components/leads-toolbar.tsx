"use client";

import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LeadFacets } from "@/features/leads/hooks/use-leads";
import type { LeadFilters } from "@/features/leads/api/queries";

const SCOPES: { value: NonNullable<LeadFilters["scope"]>; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unseen", label: "Unseen" },
  { value: "viewed", label: "Viewed" },
  { value: "applied", label: "Applied" },
  { value: "hidden", label: "Hidden" },
];

export function LeadsToolbar({
  filters,
  onChange,
  facets,
  search,
  onSearch,
}: {
  filters: LeadFilters;
  onChange: (patch: Partial<LeadFilters>) => void;
  facets?: LeadFacets;
  search: string;
  onSearch: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search title, company, tech…"
            className="pl-8"
          />
        </div>

        <Select
          value={filters.source ?? "all"}
          onValueChange={(value) =>
            onChange({ source: value === "all" ? undefined : value, page: 1 })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {(facets?.sources ?? []).map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.value} ({source.total})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.workMode ?? "all"}
          onValueChange={(value) =>
            onChange({ workMode: value === "all" ? undefined : value, page: 1 })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Work mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any mode</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="onsite">Onsite</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort ?? "recent"}
          onValueChange={(value) =>
            onChange({ sort: value as LeadFilters["sort"], page: 1 })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Reset filters"
          onClick={() =>
            onChange({
              source: undefined,
              workMode: undefined,
              tech: undefined,
              company: undefined,
              sort: "recent",
              scope: "all",
              page: 1,
            })
          }
        >
          <SlidersHorizontal />
        </Button>
      </div>

      <Tabs
        value={filters.scope ?? "all"}
        onValueChange={(value) =>
          onChange({ scope: value as LeadFilters["scope"], page: 1 })
        }
      >
        <TabsList>
          {SCOPES.map((scope) => (
            <TabsTrigger key={scope.value} value={scope.value}>
              {scope.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
