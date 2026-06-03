import type { ComponentType } from "react";
import Kocteau030Changelog from "./kocteau-0-3-0.mdx";
import Kocteau035Changelog from "./kocteau-0-3-5.mdx";
import Kocteau034Changelog from "./kocteau-0-3-4.mdx";
import Kocteau033Changelog from "./kocteau-0-3-3.mdx";
import Kocteau032Changelog from "./kocteau-0-3-2.mdx";
import Kocteau031Changelog from "./kocteau-0-3-1.mdx";

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
  {
    slug: "kocteau-0-3-1",
    title: "A steadier mobile session",
    date: "2026-05-24",
    version: "0.3.1",
    summary:
      "A public draft from the latest release, focused on mobile polish and the reading experience.",
    Content: Kocteau031Changelog,
  },
  {
    slug: "kocteau-0-3-2",
    title: "A cleaner review loop",
    date: "2026-05-27",
    version: "0.3.2",
    summary:
      "A public draft from the latest release, focused on reviews and discovery.",
    Content: Kocteau032Changelog,
  },
  {
    slug: "kocteau-0-3-3",
    title: "Kocteau 0.3.3",
    date: "2026-06-01",
    version: "0.3.3",
    summary:
      "A public draft from the latest Kocteau release.",
    Content: Kocteau033Changelog,
  },
  {
    slug: "kocteau-0-3-4",
    title: "Kocteau 0.3.4",
    date: "2026-06-02",
    version: "0.3.4",
    summary:
      "A public draft from the latest Kocteau release.",
    Content: Kocteau034Changelog,
  },
  {
    slug: "kocteau-0-3-5",
    title: "A steadier mobile session",
    date: "2026-06-03",
    version: "0.3.5",
    summary:
      "A public draft from the latest release, focused on mobile polish and the reading experience.",
    Content: Kocteau035Changelog,
  },
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
