"use client";

import * as React from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";

export function SignupForm() {
  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    password: "",
    note: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ message: string; first: boolean } | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await apiFetch<{ status: string; message: string }>(
        "/api/v1/auth/signup",
        { method: "POST", json: form },
      );
      setDone({ message: result.message, first: result.status === "active" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign up");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <span className="flex size-10 items-center justify-center rounded-full bg-success/15 text-success">
            <CircleCheck className="size-5" />
          </span>
          <CardTitle className="text-xl">
            {done.first ? "Account ready" : "You're on the list"}
          </CardTitle>
          <CardDescription>{done.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Request access</CardTitle>
        <CardDescription>
          Create an account. A super admin approves new accounts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              required
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Why do you need access? (optional)</Label>
            <Textarea
              id="note"
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Create account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
