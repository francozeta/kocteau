import type { ReactNode } from "react";
import AppShell from "@/components/app-shell";

export default function MainLayout({ children }: { children: ReactNode }) {
  return <AppShell variant="feed">{children}</AppShell>;
}
