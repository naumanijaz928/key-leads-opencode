"use client";

import * as React from "react";
import { Mail, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe, useUpdateMe } from "@/features/account/hooks/use-account";
import { initials } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default function ProfilePage() {
  const me = useMe();
  const user = me.data?.user;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Profile"
        description="Your account details and display name."
      />

      {me.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : user ? (
        <ProfileForm user={user} />
      ) : null}
    </div>
  );
}

function ProfileForm({ user }: { user: SessionUser }) {
  const update = useUpdateMe();

  const [fullName, setFullName] = React.useState(user.fullName ?? "");
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl ?? "");
  const [timezone, setTimezone] = React.useState("UTC");

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <Avatar className="size-16">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback>
              {initials(user.fullName ?? user.email ?? "?")}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-lg font-semibold">
              {user.fullName ?? "Unnamed user"}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              {user.email}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary">
                <ShieldCheck />
                {user.role}
              </Badge>
              <Badge variant="muted">{user.teamName ?? "No team"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4" />
            Edit details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="profile-avatar">Avatar URL</Label>
            <Input
              id="profile-avatar"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="profile-timezone">Timezone</Label>
            <Input
              id="profile-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            />
          </div>
          <Button
            onClick={() =>
              update.mutate(
                { fullName, avatarUrl: avatarUrl || null, timezone },
                {
                  onSuccess: () => toast.success("Profile updated"),
                  onError: (error) => toast.error(error.message),
                },
              )
            }
            disabled={update.isPending || fullName.length < 2}
          >
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
