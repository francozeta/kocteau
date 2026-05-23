import type { ComponentType } from "react";
import Kocteau030Changelog from "./kocteau-0-3-0.mdx";

export type PublicChangelogEntry = {
  slug: string;
  title: string;
  date: string;
  version?: string;
  summary: string;
  draft?: boolean;
  Content: ComponentType;
};

export const publicChangelogEntries: PublicChangelogEntry[] = [
  // public-changelog-entry
  {
    slug: "kocteau-0-3-0",
    title: "A calmer first session",
    date: "2026-05-18",
    version: "0.3.0",
    summary:
      "Mobile polish, onboarding refinements, and a steadier reading surface for early Kocteau listeners.",
    Content: Kocteau030Changelog,
  },
];
