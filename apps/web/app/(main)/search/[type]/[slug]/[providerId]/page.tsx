import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DiscoverEditorialEdition from "@/components/discover-editorial-edition";
import { isDeezerProviderId } from "@/lib/deezer";
import { createPageMetadata } from "@/lib/metadata";
import { getDiscoverySeed } from "@/lib/queries/discovery-seed";
import { getPublicStarterTracks } from "@/lib/queries/starter";
import { isSearchEntityType } from "@/lib/search-types";

type DiscoveryRouteProps = {
  params: Promise<{ providerId: string; slug: string; type: string }>;
};

export async function generateMetadata({
  params,
}: DiscoveryRouteProps): Promise<Metadata> {
  const route = await params;

  if (
    !isSearchEntityType(route.type) ||
    !isDeezerProviderId(route.providerId)
  ) {
    notFound();
  }

  const seed = await getDiscoverySeed(route.type, route.providerId);

  if (!seed) {
    notFound();
  }

  return createPageMetadata({
    title: `Discover from ${seed.title}`,
    description: `Explore music connected to ${seed.title} on Kocteau.`,
    path: `/search/${route.type}/${route.slug}/${route.providerId}`,
    noIndex: true,
  });
}

export default async function DiscoveryRoute({ params }: DiscoveryRouteProps) {
  const route = await params;

  if (
    !isSearchEntityType(route.type) ||
    !isDeezerProviderId(route.providerId)
  ) {
    notFound();
  }

  const [initialSeed, starterTracks] = await Promise.all([
    getDiscoverySeed(route.type, route.providerId),
    getPublicStarterTracks({ limit: 18, contextKey: "search-orbit" }),
  ]);

  if (!initialSeed) {
    notFound();
  }

  return (
    <DiscoverEditorialEdition
      starterTracks={starterTracks}
      initialSeed={initialSeed}
    />
  );
}
