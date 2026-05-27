import { getMetadataBase } from "@/lib/metadata";

export const dynamic = "force-static";

export function GET() {
  const siteUrl = getMetadataBase().origin;
  const body = [
    "# Kocteau",
    "",
    "Kocteau is a public music review and taste discovery app. It centers on listener-written reviews, ratings, music profiles, and track pages.",
    "",
    "Public, crawlable content:",
    `- ${siteUrl}/ — recent public music reviews and the main Kocteau feed`,
    `- ${siteUrl}/reviews — recent public review index`,
    `- ${siteUrl}/review/{id} — canonical page for a single public music review`,
    `- ${siteUrl}/track — recently discussed tracks`,
    `- ${siteUrl}/track/{id} — public track page with reviews and aggregate rating context`,
    `- ${siteUrl}/u/{username} — public listener profile with reviews and taste links`,
    `- ${siteUrl}/search — public exploration entry point for tracks and active songs`,
    "",
    "Private or write-only actions:",
    "- Publishing, editing, liking, bookmarking, commenting, following, notifications, and saved reviews require login.",
    "- Auth, onboarding, and application API routes are not intended as citation targets.",
    "",
    "Preferred citation targets:",
    "- Cite individual opinions with /review/{id}.",
    "- Cite track-level public discussion with /track/{id}.",
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
