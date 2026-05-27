import type { MetadataRoute } from "next";
import { helpRoutes } from "@/lib/help";
import { getMetadataBase } from "@/lib/metadata";
import { supabasePublic } from "@/lib/supabase/public";

type SitemapProfile = {
  username: string;
  created_at: string;
  updated_at: string;
};

type SitemapReview = {
  id: string;
  entity_id: string;
  created_at: string;
  updated_at: string;
  entities:
    | {
        id: string;
        created_at: string;
        updated_at: string;
        type: string;
      }
    | Array<{
        id: string;
        created_at: string;
        updated_at: string;
        type: string;
      }>
    | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const metadataBase = getMetadataBase();
  const supabase = supabasePublic();
  const now = new Date();
  const [profilesResult, reviewsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, created_at, updated_at")
      .eq("onboarded", true)
      .not("username", "is", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("reviews")
      .select(`
        id,
        entity_id,
        created_at,
        updated_at,
        entities (
          id,
          created_at,
          updated_at,
          type
        )
      `)
      .order("updated_at", { ascending: false })
      .limit(5000),
  ]);

  const profiles = (profilesResult.data ?? []) as SitemapProfile[];
  const reviews = (reviewsResult.data ?? []) as SitemapReview[];
  const reviewedTracks = new Map<string, Date>();

  for (const review of reviews) {
    const entity = Array.isArray(review.entities)
      ? review.entities[0] ?? null
      : review.entities;

    if (!entity?.id || entity.type !== "track") {
      continue;
    }

    const currentDate = reviewedTracks.get(entity.id);
    const reviewDate = new Date(review.updated_at ?? review.created_at);
    const entityDate = new Date(entity.updated_at ?? entity.created_at);
    const latestDate = reviewDate > entityDate ? reviewDate : entityDate;

    if (!currentDate || latestDate > currentDate) {
      reviewedTracks.set(entity.id, latestDate);
    }
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: new URL("/", metadataBase).toString(),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: new URL("/reviews", metadataBase).toString(),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: new URL("/track", metadataBase).toString(),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: new URL("/search", metadataBase).toString(),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.65,
    },
    ...helpRoutes.map((route) => ({
      url: new URL(route.href, metadataBase).toString(),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: route.href === "/help" ? 0.45 : 0.35,
    })),
  ];

  const profileRoutes: MetadataRoute.Sitemap = profiles
    .filter((profile) => Boolean(profile.username))
    .map((profile) => ({
      url: new URL(`/u/${profile.username}`, metadataBase).toString(),
      lastModified: new Date(profile.updated_at ?? profile.created_at),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  const reviewRoutes: MetadataRoute.Sitemap = reviews.map((review) => ({
    url: new URL(`/review/${review.id}`, metadataBase).toString(),
    lastModified: new Date(review.updated_at ?? review.created_at),
    changeFrequency: "weekly",
    priority: 0.78,
  }));

  const trackRoutes: MetadataRoute.Sitemap = Array.from(reviewedTracks, ([trackId, lastModified]) => ({
    url: new URL(`/track/${trackId}`, metadataBase).toString(),
    lastModified,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...reviewRoutes, ...trackRoutes, ...profileRoutes];
}
