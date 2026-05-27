import type { MetadataRoute } from "next";
import { getMetadataBase } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  const metadataBase = getMetadataBase();
  const publicAllow = ["/", "/api/og/"];
  const privateDisallow = [
    "/login",
    "/signup",
    "/onboarding",
    "/notifications",
    "/saved",
    "/api/",
    "/track/deezer/",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: publicAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: ["Googlebot", "OAI-SearchBot", "GPTBot", "ChatGPT-User"],
        allow: publicAllow,
        disallow: privateDisallow,
      },
    ],
    sitemap: new URL("/sitemap.xml", metadataBase).toString(),
    host: metadataBase.origin,
  };
}
