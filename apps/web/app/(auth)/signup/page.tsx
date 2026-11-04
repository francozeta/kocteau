import SignupPageClient from "@/components/auth/signup-page-client";
import type { Viewport } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { documentThemeColors } from "@/lib/document-viewport";

export const viewport: Viewport = {
  themeColor: documentThemeColors.auth,
};

export const metadata = createPageMetadata({
  title: "Create account",
  description: "Create your Kocteau account with a one-time email code.",
  path: "/signup",
  noIndex: true,
});

export default function SignupPage() {
  return <SignupPageClient />;
}
