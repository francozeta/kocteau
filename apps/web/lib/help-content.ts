import type { ComponentType } from "react";
import type { HelpDocumentSlug } from "@/lib/help";

type HelpMdxModule = {
  default: ComponentType;
};

const helpDocumentLoaders: Record<
  HelpDocumentSlug,
  () => Promise<HelpMdxModule>
> = {
  terms: () => import("@/content/help/terms.mdx"),
  privacy: () => import("@/content/help/privacy.mdx"),
  cookies: () => import("@/content/help/cookies.mdx"),
  accessibility: () => import("@/content/help/accessibility.mdx"),
  changelog: () => import("@/content/help/changelog.mdx"),
};

export function loadHelpDocument(slug: HelpDocumentSlug) {
  return helpDocumentLoaders[slug]();
}
