import type { ReactNode } from "react";
import AppShell from "@/components/shell/app-shell";

export default function MainLayout({ children }: { children: ReactNode }) {
  return <AppShell variant="feed">{children}</AppShell>;
}
