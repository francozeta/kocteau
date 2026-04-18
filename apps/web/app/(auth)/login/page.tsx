import LoginPageClient from "@/components/auth/login-page-client";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Log in",
  description: "Log in to Kocteau with a one-time email code.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return <LoginPageClient />;
}
