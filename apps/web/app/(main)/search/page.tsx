import type { Metadata } from "next";
import DiscoverEditorialEdition from "@/components/discover-editorial-edition";
import SearchPageClient from "@/components/search-page-client";
import { createPageMetadata } from "@/lib/metadata";
import { getAtlasTags } from "@/lib/queries/atlas";
import { getRecentlyDiscussedTracks } from "@/lib/queries/discovery";
import { getPublicStarterTracks } from "@/lib/queries/starter";
import { isSearchEntityType } from "@/lib/search-types";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q?.trim();

  if (!query) {
    return createPageMetadata({
      title: "Discover",
      description: "Search tracks and discover music through real reviews on Kocteau.",
      path: "/search",
    });
  }

  return createPageMetadata({
    title: `Discover: ${query}`,
    description: `Track results for ${query} on Kocteau.`,
    path: `/search?q=${encodeURIComponent(query)}`,
    noIndex: true,
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = params.q?.trim() ?? "";
  const initialType = isSearchEntityType(params.type) ? params.type : "track";
  const discoverData = initialQuery
    ? null
    : await Promise.all([
        getRecentlyDiscussedTracks(8),
        getPublicStarterTracks({ limit: 6, contextKey: "discover" }),
        getAtlasTags(),
      ]);

  const discoverContent = discoverData ? (
    <DiscoverEditorialEdition
      discussedTracks={discoverData[0]}
      starterTracks={discoverData[1]}
      atlasTags={discoverData[2]}
    />
  ) : null;

  return (
    <SearchPageClient
      key={`${initialType}:${initialQuery}`}
      initialQuery={initialQuery}
      initialType={initialType}
      discoverContent={discoverContent}
    />
  );
}
