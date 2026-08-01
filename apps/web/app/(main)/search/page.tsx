import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DiscoverEditorialEdition from "@/components/discover-editorial-edition";
import { getDiscoverySeedPath } from "@/lib/discovery/seed";
import { createPageMetadata } from "@/lib/metadata";
import { getPublicStarterTracks } from "@/lib/queries/starter";

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
      description:
        "Search songs, albums, and artists, then discover music through real reviews on Kocteau.",
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
  const starterTracks = await getPublicStarterTracks({
    limit: 18,
    contextKey: "search-orbit",
  });
  const legacySeedTrack = params.seed
    ? starterTracks.find((track) => track.provider_id === params.seed)
    : null;

  if (legacySeedTrack) {
    redirect(
      getDiscoverySeedPath({
        provider_id: legacySeedTrack.provider_id,
        title: legacySeedTrack.title,
        type: "track",
      }),
    );
  }

  return (
    <DiscoverEditorialEdition
      starterTracks={starterTracks}
      initialQuery={initialQuery}
    />
  );
}
