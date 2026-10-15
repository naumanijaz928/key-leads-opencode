"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api-client";

interface VerifyResult {
  valid: boolean;
  email?: string;
  role?: string;
  teamName?: string | null;
  reason?: string;
}

const REASON_LABELS: Record<string, string> = {
  missing_token: "This invitation link is incomplete.",
  not_found: "This invitation could not be found.",
  used: "This invitation has already been used.",
  expired: "This invitation has expired. Ask an admin for a new one.",
};

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [verify, setVerify] = React.useState<VerifyResult | null>(null);
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    apiFetch<VerifyResult>(
      `/api/v1/invitations/verify?token=${encodeURIComponent(token)}`,
    )
      .then((result) => {
        if (active) setVerify(result);
      })
      .catch(() => {
        if (active) setVerify({ valid: false, reason: "not_found" });
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/v1/auth/accept-invite", {
        method: "POST",
        json: { token, fullName, password },
      });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept invitation");
    } finally {
      setLoading(false);
    }
  }

  if (!verify) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="grid gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!verify.valid) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <span className="flex size-10 items-center justify-center rounded-full bg-destructive/12 text-destructive">
            <CircleAlert className="size-5" />
          </span>
          <CardTitle className="text-xl">Invitation unavailable</CardTitle>
          <CardDescription>
            {REASON_LABELS[verify.reason ?? "not_found"] ??
              "This invitation is not valid."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <a href="/login">Go to sign in</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Join KeyLeads</CardTitle>
        <CardDescription>
          {verify.email} · {verify.role?.replace("_", " ")}
          {verify.teamName ? ` · ${verify.teamName}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Create a password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Joining…" : "Accept invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
