import { Logo } from "@/components/layout/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-12">
      <Logo />
      {children}
      <p className="text-xs text-muted-foreground">
        Remote job leads, triaged by your team.
      </p>
    </div>
  );
}
