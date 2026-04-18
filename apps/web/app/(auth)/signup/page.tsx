import SignupPageClient from "@/components/auth/signup-page-client";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Create account",
  description: "Create your Kocteau account with a one-time email code.",
  path: "/signup",
  noIndex: true,
});

export default function SignupPage() {
  return <SignupPageClient />;
}
