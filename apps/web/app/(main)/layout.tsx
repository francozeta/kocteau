import type { ReactNode } from "react";
import AppShell from "@/components/shell/app-shell";
import { getAppViewport } from "@/lib/document-viewport";

export async function generateViewport() {
  return getAppViewport();
}

export default function MainLayout({ children }: { children: ReactNode }) {
  return <AppShell variant="feed">{children}</AppShell>;
}
