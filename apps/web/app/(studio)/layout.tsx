import type { ReactNode } from "react";
import AppShell from "@/components/shell/app-shell";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <AppShell variant="studio">{children}</AppShell>;
}
