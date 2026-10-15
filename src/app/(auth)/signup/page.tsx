import type { Metadata } from "next";

import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = { title: "Request access" };

export default function SignupPage() {
  return <SignupForm />;
}
