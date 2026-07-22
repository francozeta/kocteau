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
    "/api/",
    "/track/deezer/",
    "/*opengraph-image*",
    "/*twitter-image*",
  ];
  const aiCrawlerDisallow = [
    "CCBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-SearchBot",
    "GPTBot",
    "PerplexityBot",
    "OAI-SearchBot",
    "Bytespider",
    "Applebot-Extended",
  ];

  return {
    rules: [
      {
        userAgent: aiCrawlerDisallow,
        disallow: ["/"],
      },
      {
        userAgent: "*",
        allow: publicAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: "Googlebot",
        allow: publicAllow,
        disallow: privateDisallow,
      },
    ],
    sitemap: new URL("/sitemap.xml", metadataBase).toString(),
    host: metadataBase.origin,
  };
}
