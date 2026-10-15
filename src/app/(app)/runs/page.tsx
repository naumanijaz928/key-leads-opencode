"use client";

import * as React from "react";
import { CircleX, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCancelRun,
  useCreateRun,
  useRuns,
  useRunStream,
} from "@/features/runs/hooks/use-runs";
import { useSearches } from "@/features/searches/hooks/use-searches";
import { useSources } from "@/features/sources/hooks/use-sources";
import type { Run, RunSourceStatus } from "@/types";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  queued: "secondary",
  running: "default",
  done: "success",
  failed: "destructive",
  cancelled: "warning",
  ok: "success",
  skipped: "secondary",
  not_configured: "warning",
  pending: "secondary",
};

function formatDuration(run: Run) {
  if (!run.startedAt) return "—";
  const end = run.finishedAt ? new Date(run.finishedAt) : new Date();
  const seconds = Math.max(
    0,
    Math.round((end.getTime() - new Date(run.startedAt).getTime()) / 1000),
  );
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function RunsPage() {
  const runs = useRuns();
  const cancel = useCancelRun();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Run | null>(null);

  const items = runs.data?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Runs"
        description="Runs are manual. Trigger one any time to collect fresh leads."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh"
              onClick={() => runs.refetch()}
            >
              <RefreshCw />
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Play />
              Run now
            </Button>
          </div>
        }
      />

      {runs.isLoading && items.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sources</TableHead>
                <TableHead>New leads</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((run) => (
                <TableRow
                  key={run.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(run)}
                >
                  <TableCell className="font-mono text-xs">
                    {run.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[run.status] ?? "secondary"}>
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {run.completedSources}/{run.totalSources}
                  </TableCell>
                  <TableCell className="tabular-nums">{run.newLeads}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {run.createdAt ? new Date(run.createdAt).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDuration(run)}
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    {run.status === "running" || run.status === "queued" ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Cancel run"
                        onClick={() =>
                          cancel.mutate(run.id, {
                            onSuccess: () => toast.success("Run cancelled"),
                          })
                        }
                      >
                        <CircleX />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={<Play />}
          title="No runs yet"
          description="Start a run to collect leads from your enabled sources."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Play />
              Run now
            </Button>
          }
        />
      )}

      {dialogOpen ? <NewRunDialog onOpenChange={setDialogOpen} /> : null}

      <RunDetailDialog
        run={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function NewRunDialog({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const searches = useSearches();
  const sources = useSources();
  const create = useCreateRun();

  const [searchId, setSearchId] = React.useState<string>("default");
  const [override, setOverride] = React.useState<string[] | null>(null);

  const enabledKeys = React.useMemo(
    () =>
      (sources.data?.items ?? [])
        .filter((source) => source.enabled)
        .map((source) => source.key),
    [sources.data],
  );

  const selectedKeys = override ?? enabledKeys;

  function toggle(key: string) {
    setOverride((prev) => {
      const base = prev ?? enabledKeys;
      return base.includes(key)
        ? base.filter((item) => item !== key)
        : [...base, key];
    });
  }

  function submit() {
    create.mutate(
      {
        searchId: searchId === "default" ? null : searchId,
        sources: selectedKeys,
      },
      {
        onSuccess: () => {
          toast.success("Run started");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Start a run</DialogTitle>
          <DialogDescription>
            Choose a search profile and the sources to collect from.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5">
          <Label>Search profile</Label>
          <Select value={searchId} onValueChange={setSearchId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default profile</SelectItem>
              {(searches.data?.items ?? []).map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Sources ({selectedKeys.length} selected)</Label>
          <div className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin rounded-lg border border-border p-2">
            {(sources.data?.items ?? []).map((source) => (
              <label
                key={source.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={selectedKeys.includes(source.key)}
                  onCheckedChange={() => toggle(source.key)}
                />
                <span>{source.name}</span>
                {!source.configured && source.requiresKey ? (
                  <Badge variant="warning">not configured</Badge>
                ) : null}
              </label>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={create.isPending || selectedKeys.length === 0}
          >
            <Play />
            Start run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RunDetailDialog({
  run,
  onOpenChange,
}: {
  run: Run | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { snapshot, live } = useRunStream(run?.id ?? null);
  const current = snapshot?.run ?? run;
  const currentSources = snapshot?.sources ?? [];

  return (
    <Dialog open={Boolean(run)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {current ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Run {current.id.slice(0, 8)}
                <Badge variant={STATUS_VARIANT[current.status] ?? "secondary"}>
                  {current.status}
                </Badge>
                {live ? <Badge variant="default">live</Badge> : null}
              </DialogTitle>
              <DialogDescription>
                {current.newLeads} new leads · {current.matched} matched ·{" "}
                {current.fetched} fetched
              </DialogDescription>
            </DialogHeader>

            {current.totalSources > 0 ? (
              <Progress
                value={(current.completedSources / current.totalSources) * 100}
              />
            ) : null}

            <div className="max-h-80 overflow-y-auto scrollbar-thin rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fetched</TableHead>
                    <TableHead>Matched</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentSources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell>{source.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANT[source.status as RunSourceStatus] ??
                            "secondary"
                          }
                        >
                          {source.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{source.fetched}</TableCell>
                      <TableCell className="tabular-nums">{source.matched}</TableCell>
                      <TableCell className="tabular-nums">{source.newLeads}</TableCell>
                      <TableCell className="max-w-40 truncate text-xs text-destructive">
                        {source.error ?? ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
