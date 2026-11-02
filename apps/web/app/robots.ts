import type { MetadataRoute } from "next";
import { getMetadataBase } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  const metadataBase = getMetadataBase();
  const publicAllow = ["/"];
  const privateDisallow = [
    "/login",
    "/signup",
    "/onboarding",
    "/feed",
    "/library",
    "/notifications",
    "/saved",
    "/settings",
    "/studio",
    "/auth/",
    "/api/",
    "/track/deezer/",
    "/album/deezer/",
    "/artist/deezer/",
    "/*opengraph-image*",
    "/*twitter-image*",
  ];
  // Discovery assistants may read public pages, but cannot access app/private routes.
  // Keep training-oriented crawlers opt-out; this is separate from the WAF.
  const discoveryCrawlers = [
    "ChatGPT-User",
    "OAI-SearchBot",
    "Claude-SearchBot",
    "PerplexityBot",
  ];
  const restrictedCrawlers = [
    "CCBot",
    "ClaudeBot",
    "GPTBot",
    "Bytespider",
    "Applebot-Extended",
  ];

  return {
    rules: [
      {
        userAgent: discoveryCrawlers,
        allow: publicAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: restrictedCrawlers,
        allow: ["/docs", "/llms.txt"],
        disallow: ["/"],
      },
      {
        userAgent: "*",
        allow: publicAllow,
        disallow: privateDisallow,
      },
    ],
    sitemap: new URL("/sitemap.xml", metadataBase).toString(),
    host: metadataBase.origin,
  };
}
