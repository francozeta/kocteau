import type { MetadataRoute } from "next";
import { getMetadataBase } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  const metadataBase = getMetadataBase();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/signup",
        "/onboarding",
        "/notifications",
        "/saved",
        "/api/",
        "/track/deezer/",
      ],
    },
    sitemap: new URL("/sitemap.xml", metadataBase).toString(),
    host: metadataBase.origin,
  };
}
