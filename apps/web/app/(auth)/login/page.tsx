import LoginPageClient from "@/components/auth/login-page-client";
import type { Viewport } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { documentThemeColors } from "@/lib/document-viewport";

export const viewport: Viewport = {
  themeColor: documentThemeColors.auth,
};

export const metadata = createPageMetadata({
  title: "Log in",
  description: "Log in to Kocteau with a one-time email code.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return <LoginPageClient />;
}
