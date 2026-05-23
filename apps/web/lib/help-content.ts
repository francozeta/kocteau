import type { ComponentType } from "react";
import type { HelpDocumentSlug } from "@/lib/help";

type HelpMdxModule = {
  default: ComponentType;
};

type HelpMdxDocumentSlug = Exclude<HelpDocumentSlug, "changelog">;

const helpDocumentLoaders: Record<
  HelpMdxDocumentSlug,
  () => Promise<HelpMdxModule>
> = {
  terms: () => import("@/content/help/terms.mdx"),
  privacy: () => import("@/content/help/privacy.mdx"),
  cookies: () => import("@/content/help/cookies.mdx"),
  accessibility: () => import("@/content/help/accessibility.mdx"),
};

export function isMdxHelpDocumentSlug(
  slug: HelpDocumentSlug,
): slug is HelpMdxDocumentSlug {
  return slug !== "changelog";
}

export function loadHelpDocument(slug: HelpMdxDocumentSlug) {
  return helpDocumentLoaders[slug]();
}
