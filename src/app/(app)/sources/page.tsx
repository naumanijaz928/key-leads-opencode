"use client";

import * as React from "react";
import { PlugZap } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useSources, useToggleSource } from "@/features/sources/hooks/use-sources";
import type { SourceRow } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  keyless: "Keyless (no API key)",
  keyed: "Keyed (free tier API key)",
  scraped: "Scraped / provider-backed",
  provider: "Third-party providers",
  manual: "Manual import",
};

export default function SourcesPage() {
  const sources = useSources();
  const toggle = useToggleSource();

  const grouped = React.useMemo(() => {
    const map = new Map<string, SourceRow[]>();
    for (const source of sources.data?.items ?? []) {
      const list = map.get(source.category) ?? [];
      list.push(source);
      map.set(source.category, list);
    }
    return map;
  }, [sources.data]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Sources"
        description="Enable connectors. Keyed sources need an environment variable to run."
      />

      {sources.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : grouped.size > 0 ? (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((source) => (
                  <Card key={source.id}>
                    <CardHeader className="flex-row items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                          {source.name}
                          {source.requiresKey && !source.configured ? (
                            <Badge variant="warning">not configured</Badge>
                          ) : null}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {source.description}
                        </p>
                      </div>
                      <Switch
                        checked={source.enabled}
                        onCheckedChange={(enabled) =>
                          toggle.mutate(
                            { id: source.id, enabled },
                            {
                              onError: (error) => toast.error(error.message),
                            },
                          )
                        }
                      />
                    </CardHeader>
                    {source.keyEnvVar ? (
                      <CardContent>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {source.keyEnvVar}
                        </code>
                      </CardContent>
                    ) : null}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<PlugZap />}
          title="No sources"
          description="Sources are seeded from the catalog on first load."
        />
      )}
    </div>
  );
}
