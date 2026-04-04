import type { MetadataRoute } from "next";
import { getMetadataBase } from "@/lib/metadata";

const publicRoutes = ["/", "/search", "/track"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const metadataBase = getMetadataBase();
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: new URL(route, metadataBase).toString(),
    lastModified: now,
    changeFrequency: route === "/" ? "hourly" : "daily",
    priority: route === "/" ? 1 : 0.7,
  }));
}
