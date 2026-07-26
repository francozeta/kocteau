import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CatalogEntityPage from "@/components/catalog-entity-page";
import { getDeezerArtistPageData } from "@/lib/catalog/page-data";
import { createPageMetadata } from "@/lib/metadata";
import { getArtistPageByProvider } from "@/lib/queries/artists";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";

type ProviderArtistParams = { providerId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<ProviderArtistParams>;
}): Promise<Metadata> {
  const { providerId } = await params;
  const data = await getDeezerArtistPageData(providerId);

  return createPageMetadata({
    title: data?.artist.name ?? "Artist",
    description: data
      ? `Tracks and releases from ${data.artist.name}.`
      : "Artist context on Kocteau.",
    path: `/artist/deezer/${providerId}`,
    image: data?.artist.picture_url,
    noIndex: !data,
  });
}

export default async function DeezerArtistPage({
  params,
}: {
  params: Promise<ProviderArtistParams>;
}) {
  const { providerId } = await params;
  const localArtist = await getArtistPageByProvider("deezer", providerId);

  if (localArtist) {
    permanentRedirect(
      buildEntityCanonicalPath({
        id: localArtist.id,
        provider: localArtist.provider,
        provider_id: localArtist.provider_id,
        type: "artist",
        title: localArtist.name,
      }),
    );
  }

  const data = await getDeezerArtistPageData(providerId);

  if (!data) {
    notFound();
  }

  return (
    <CatalogEntityPage
      kind="Artist"
      title={data.artist.name}
      imageUrl={data.artist.picture_url}
      shelves={[
        {
          title: "Essential tracks",
          items: data.tracks.map((track) => ({
            provider: "deezer",
            providerId: track.provider_id,
            type: "track",
            title: track.title,
            artistName: track.artist_name,
            coverUrl: track.cover_url,
          })),
        },
        {
          title: "Releases",
          items: data.albums.map((album) => ({
            provider: "deezer",
            providerId: album.id,
            type: "album",
            title: album.title,
            artistName: album.artist_name ?? data.artist.name,
            coverUrl: album.cover_url,
          })),
        },
      ]}
    />
  );
}
