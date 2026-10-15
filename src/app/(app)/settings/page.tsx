"use client";

import * as React from "react";
import { Download, Palette, SlidersHorizontal } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useSettings,
  useUpdateSettings,
  type AppSettings,
} from "@/features/account/hooks/use-account";

export default function SettingsPage() {
  const settings = useSettings();
  const data = settings.data?.data;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Settings"
        description="Workspace defaults, appearance, and exports."
      />

      {settings.isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <SettingsForm settings={data} teamId={settings.data?.teamId ?? null} />
      )}
    </div>
  );
}

function SettingsForm({
  settings,
  teamId,
}: {
  settings: AppSettings;
  teamId: string | null;
}) {
  const update = useUpdateSettings();
  const { theme, setTheme } = useTheme();

  const [windowHours, setWindowHours] = React.useState(
    String(settings.default_window_hours),
  );
  const [remotePolicy, setRemotePolicy] = React.useState(
    settings.default_remote_policy,
  );
  const [emailNotifications, setEmailNotifications] = React.useState(
    settings.email_notifications,
  );
  const [attribution, setAttribution] = React.useState(
    settings.attribution_enabled,
  );

  function save() {
    update.mutate(
      {
        default_window_hours: Number(windowHours) || 72,
        default_remote_policy: remotePolicy,
        email_notifications: emailNotifications,
        attribution_enabled: attribution,
      },
      {
        onSuccess: () => toast.success("Settings saved"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" />
            Collection defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="window-hours">Look-back window (hours)</Label>
            <Input
              id="window-hours"
              type="number"
              value={windowHours}
              onChange={(event) => setWindowHours(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Default remote policy</Label>
            <Select value={remotePolicy} onValueChange={setRemotePolicy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote_only">Remote only</SelectItem>
                <SelectItem value="remote_or_hybrid">Remote or hybrid</SelectItem>
                <SelectItem value="any">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Email notifications for approved sign-ups and invites</span>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Show source attribution (required by some boards)</span>
            <Switch checked={attribution} onCheckedChange={setAttribution} />
          </label>
          <Button onClick={save} disabled={update.isPending || !teamId}>
            Save settings
          </Button>
          {!teamId ? (
            <p className="text-xs text-muted-foreground">
              Assign yourself to a team to persist workspace settings.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={theme ?? "system"} onValueChange={setTheme}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="size-4" />
            Export
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href="/api/v1/export/leads?format=csv">
              <Download />
              Export leads (CSV)
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/v1/export/leads?format=json">
              <Download />
              Export leads (JSON)
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
