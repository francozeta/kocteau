import type { Metadata } from "next";
import SearchPageClient from "@/components/search-page-client";
import { createPageMetadata } from "@/lib/metadata";
import { getRecentlyDiscussedTracks } from "@/lib/queries/discovery";
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
      title: "Explore",
      description: "Search tracks and browse active songs on Kocteau.",
      path: "/search",
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: `Explore: ${query}`,
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
  const highlights = await getRecentlyDiscussedTracks(8);

  return (
    <SearchPageClient
      initialQuery={initialQuery}
      initialType={initialType}
      highlights={highlights}
    />
  );
}
