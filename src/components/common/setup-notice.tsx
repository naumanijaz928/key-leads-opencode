import { Database, KeyRound, Mail } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const steps = [
  {
    icon: Database,
    title: "1. Supabase",
    body: "Create a Supabase project, then set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL in .env.local.",
  },
  {
    icon: KeyRound,
    title: "2. Database + seed",
    body: "Run `npm run db:migrate` then `npm run db:seed` to create tables and seed sources, hide reasons and the default search.",
  },
  {
    icon: Mail,
    title: "3. Email (optional)",
    body: "Add RESEND_API_KEY to send invitations and approval emails. Without it, invite links are logged to the server console.",
  },
];

export function SetupNotice() {
  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">KeyLeads</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Connect your environment to continue
        </h1>
        <p className="text-muted-foreground">
          KeyLeads needs a Supabase project (Postgres + Auth). Fill in
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            .env.local
          </code>
          using <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.example</code> as a template.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <step.icon className="size-5 text-primary" />
              <CardTitle className="text-base">{step.title}</CardTitle>
              <CardDescription>{step.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optional job sources</CardTitle>
          <CardDescription>
            Add any of ADZUNA_*, JOOBLE_*, MUSE_*, FINDWORK_*, RAPIDAPI_*,
            REED_*, USAJOBS_*, CAREERJET_*, APIFY_* to enable those adapters.
            Sources without a key are skipped automatically.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
