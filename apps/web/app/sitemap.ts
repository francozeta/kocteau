import type { MetadataRoute } from "next";
import { getMetadataBase } from "@/lib/metadata";
import { supabasePublic } from "@/lib/supabase/public";

type SitemapProfile = {
  username: string;
  created_at: string;
};

type SitemapTrack = {
  id: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const metadataBase = getMetadataBase();
  const supabase = supabasePublic();
  const now = new Date();
  const [profilesResult, tracksResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("entities")
      .select("id")
      .eq("type", "track"),
  ]);

  const profiles = (profilesResult.data ?? []) as SitemapProfile[];
  const tracks = (tracksResult.data ?? []) as SitemapTrack[];

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: new URL("/", metadataBase).toString(),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: new URL("/track", metadataBase).toString(),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  const profileRoutes: MetadataRoute.Sitemap = profiles
    .filter((profile) => Boolean(profile.username))
    .map((profile) => ({
      url: new URL(`/u/${profile.username}`, metadataBase).toString(),
      lastModified: new Date(profile.created_at),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  const trackRoutes: MetadataRoute.Sitemap = tracks.map((track) => ({
    url: new URL(`/track/${track.id}`, metadataBase).toString(),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...trackRoutes, ...profileRoutes];
}
