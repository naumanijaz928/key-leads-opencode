"use client";

import { ScrollText } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuditLogs } from "@/features/admin/hooks/use-admin";

export default function ActionLogsPage() {
  const logs = useAuditLogs();
  const items = logs.data?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Action logs"
        description="An audit trail of significant changes across the workspace."
      />

      {logs.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Metadata</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="secondary">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.actorName ?? log.actorEmail ?? "system"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.entityType ?? "—"}
                      {log.entityId ? `:${log.entityId.slice(0, 8)}` : ""}
                    </TableCell>
                    <TableCell className="max-w-64 truncate font-mono text-xs text-muted-foreground">
                      {log.metadata && Object.keys(log.metadata).length > 0
                        ? JSON.stringify(log.metadata)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<ScrollText />}
          title="No activity yet"
          description="Actions like runs, invites, and role changes will show up here."
        />
      )}
    </div>
  );
}
