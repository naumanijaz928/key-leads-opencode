import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Building,
  CircleCheck,
  Database,
  Play,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/queries/stats";
import { formatRelative } from "@/lib/utils";

export default async function DashboardPage() {
  const [user, stats] = await Promise.all([
    getSessionUser(),
    getDashboardStats(),
  ]);

  const cards = [
    {
      label: "Active leads",
      value: stats?.totalLeads ?? 0,
      hint: `${stats?.newLeadsThisWeek ?? 0} new this week`,
      icon: Briefcase,
    },
    {
      label: "Companies",
      value: stats?.companies ?? 0,
      hint: "tracked accounts",
      icon: Building,
    },
    {
      label: "Applications",
      value: stats?.applications ?? 0,
      hint: "marked as applied",
      icon: CircleCheck,
    },
    {
      label: "Enabled sources",
      value: stats?.sourcesEnabled ?? 0,
      hint: `${stats?.runCount ?? 0} runs total`,
      icon: Database,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title={`Welcome back${user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`}
        description="A quick look at your lead pipeline and the last collection run."
        actions={
          <Button asChild>
            <Link href="/runs">
              <Play />
              Find leads
            </Link>
          </Button>
        }
      />

      {stats === null ? (
        <Card>
          <CardHeader>
            <CardTitle>Database not reachable</CardTitle>
            <CardDescription>
              Set <code className="rounded bg-muted px-1.5 py-0.5 text-xs">DATABASE_URL</code>{" "}
              in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code>{" "}
              and run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run db:migrate</code>{" "}
              to start seeing live numbers.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div className="space-y-1">
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">
                    {card.value}
                  </CardTitle>
                </div>
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <card.icon className="size-4" />
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" />
              Last run
            </CardTitle>
            <CardDescription>
              Runs are manual: nothing is collected until you start one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.lastRun ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        stats.lastRun.status === "done"
                          ? "success"
                          : stats.lastRun.status === "failed"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {stats.lastRun.status}
                    </Badge>
                    <span className="text-sm">
                      +{stats.lastRun.newLeads} new leads
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(stats.lastRun.createdAt)}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/runs/${stats.lastRun.id}`}>
                    View run
                    <ArrowUpRight />
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No runs yet. Start one from the Runs page.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { href: "/leads", label: "Browse leads" },
              { href: "/companies", label: "Review companies" },
              { href: "/sources", label: "Configure sources" },
              { href: "/searches", label: "Manage searches" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                {link.label}
                <ArrowUpRight className="size-4" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
