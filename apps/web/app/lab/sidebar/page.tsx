import type { Metadata } from "next";
import SidebarMotionLab from "@/components/labs/sidebar-motion-lab";

export const metadata: Metadata = {
  title: "Sidebar Motion Lab — Kocteau",
  robots: { index: false, follow: false },
};

export default function SidebarLabPage() {
  return <SidebarMotionLab />;
}
