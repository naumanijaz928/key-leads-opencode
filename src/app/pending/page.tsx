import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Awaiting approval" };

export default function PendingPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-12">
      <Logo />
      <Card className="w-full max-w-md">
        <CardHeader>
          <span className="flex size-10 items-center justify-center rounded-full bg-warning/20 text-warning-foreground dark:text-warning">
            <Clock className="size-5" />
          </span>
          <CardTitle className="text-xl">Awaiting approval</CardTitle>
          <CardDescription>
            Your account is in the waiting list. A super admin will review it
            soon and you&apos;ll get an email when it&apos;s approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
