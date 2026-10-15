"use client";

import { Activity } from "lucide-react";

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
import { useSessions } from "@/features/admin/hooks/use-admin";

export default function SessionLogsPage() {
  const sessions = useSessions();
  const items = sessions.data?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Session logs"
        description="Recent sign-ins with device and IP information."
      />

      {sessions.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Last active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <p className="text-sm">{session.fullName ?? session.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.email}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {session.ip ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-xs text-muted-foreground">
                      {session.userAgent ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(session.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted">
                        {new Date(session.lastActiveAt).toLocaleString()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<Activity />}
          title="No sessions recorded"
          description="Session history appears here once users sign in."
        />
      )}
    </div>
  );
}
