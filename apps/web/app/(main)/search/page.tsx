import type { Metadata } from "next";
import DiscoverEditorialEdition from "@/components/discover-editorial-edition";
import SearchPageClient from "@/components/search-page-client";
import { createPageMetadata } from "@/lib/metadata";
import { getPublicStarterTracks } from "@/lib/queries/starter";
import { isSearchScope } from "@/lib/search-types";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; seed?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q?.trim();

  if (!query) {
    return createPageMetadata({
      title: "Search",
      description: "Search songs, albums, and artists, then discover music through real reviews on Kocteau.",
      path: "/search",
    });
  }

  return createPageMetadata({
    title: `Search: ${query}`,
    description: `Music results for ${query} on Kocteau.`,
    path: `/search?q=${encodeURIComponent(query)}`,
    noIndex: true,
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; seed?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = params.q?.trim() ?? "";
  const initialType = isSearchScope(params.type) ? params.type : "all";
  const starterTracks = initialQuery
    ? []
    : await getPublicStarterTracks({
        limit: 6,
        contextKey: "search-orbit",
      });

  const discoverContent = !initialQuery ? (
    <DiscoverEditorialEdition
      starterTracks={starterTracks}
      initialSeedProviderId={params.seed}
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
