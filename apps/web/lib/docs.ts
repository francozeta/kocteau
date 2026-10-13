import catalog from "@/.generated/docs/catalog.json";

export const documentation = catalog;
export type DocumentationPage = (typeof documentation)[number];

export function getDocumentationPage(slug: string) {
  return documentation.find((page) => page.slug === slug);
}

export function buildDocumentationIndex(siteUrl: string) {
  const groups = [...new Set(documentation.map((page) => page.group))];
  return [
    "# Kocteau Documentation",
    "",
    "Setup, product flows, technical contracts, and maintainer procedures. These pages use the repository's canonical Markdown sources.",
    "",
    `[Documentation](${siteUrl}/docs)`,
    "",
    ...groups.flatMap((group) => [
      `## ${group}`,
      "",
      ...documentation.filter((page) => page.group === group).map((page) =>
        `- [${page.title}](${siteUrl}${page.href}): ${page.description} [Markdown](${siteUrl}${page.href}/raw)`,
      ),
      "",
    ]),
  ].join("\n");
}
