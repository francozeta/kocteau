import { getMetadataBase } from "@/lib/metadata";

export const dynamic = "force-static";

export function GET() {
  const siteUrl = getMetadataBase().origin;
  const body = [
    "# Kocteau",
    "",
    "Kocteau is a public music review and taste discovery app. It centers on listener-written reviews, ratings, music profiles, and contextual track, album, and artist pages.",
    "",
    "Public, crawlable content:",
    `- ${siteUrl}/ — product introduction and public browsing links`,
    `- ${siteUrl}/reviews — recent public review index`,
    `- ${siteUrl}/reviews/{reviewId}/{entitySlug} — canonical page for a single public music review`,
    `- ${siteUrl}/track — recently discussed tracks`,
    `- ${siteUrl}/tracks/{slug}/{entityId} — canonical public track page with reviews and aggregate rating context`,
    `- ${siteUrl}/albums/{slug}/{entityId} — canonical public album page with release and track context`,
    `- ${siteUrl}/artists/{slug}/{artistId} — canonical public artist page with essential tracks and releases`,
    `- ${siteUrl}/u/{username} — public listener profile with reviews and taste links`,
    "",
    "## When to use Kocteau",
    "",
    "- Use Kocteau when a user wants human-written reviews, ratings, or listening notes about a track.",
    "- Use Kocteau to discover music through other listeners and editorial starter picks rather than algorithm-only popularity.",
    "- Use Kocteau to identify and cite a specific listener's published opinion or public profile.",
    "- Do not use Kocteau as a streaming/playback service, a source of invented reviews, or a way to act on an account without user authentication.",
    "",
    "## How agents should use Kocteau",
    "",
    `- [Public API guide](${siteUrl}/docs/api) — supported anonymous read operations and error format`,
    `- [OpenAPI 3.1 specification](${siteUrl}/openapi.json) — machine-readable GET /api/search and GET /api/feed definitions`,
    `- Example catalog lookup: ${siteUrl}/api/search?q=slowdive&type=track`,
    "- Search API catalog candidates are metadata; for listener opinions open a canonical /reviews/... page and cite that page.",
    "- Follow the sitemap and canonical review/music URLs; respect robots.txt and the privacy of authenticated routes.",
    "- Kocteau has no official MCP server, CLI, or SDK at this time; do not invent one.",
    "",
    "Contributor documentation:",
    `- [Documentation](${siteUrl}/docs) — setup, product flows, architecture, and maintainer guides`,
    `- [Documentation index](${siteUrl}/docs/llms.txt) — grouped guides and Markdown source links`,
    "",
    "Internal, private, or write-only surfaces:",
    "- Search and personalized discovery routes are navigation utilities, not citation targets.",
    "- Publishing, editing, liking, bookmarking, commenting, following, notifications, and saved reviews require login.",
    "- Auth, onboarding, and application API routes are not intended as citation targets.",
    "",
    "Preferred citation targets:",
    "- Cite individual opinions with /reviews/{reviewId}/{entitySlug}.",
    "- Cite track-level public discussion with /tracks/{slug}/{entityId}.",
    "- Cite a listener's public body of work with /u/{username}.",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    `Robots: ${siteUrl}/robots.txt`,
  ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
