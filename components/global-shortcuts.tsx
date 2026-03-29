"use client";

import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";

export default function GlobalShortcuts({
  profileUsername = null,
}: {
  profileUsername?: string | null;
}) {
  useGlobalShortcuts({ profileUsername });

  return null;
}
