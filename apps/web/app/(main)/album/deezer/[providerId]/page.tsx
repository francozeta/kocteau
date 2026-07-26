import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CatalogEntityPage from "@/components/catalog-entity-page";
import { getDeezerAlbumPageData } from "@/lib/catalog/page-data";
import { createPageMetadata } from "@/lib/metadata";
import { getEntityPageByProvider } from "@/lib/queries/entities";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";

type ProviderAlbumParams = { providerId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<ProviderAlbumParams>;
}): Promise<Metadata> {
  const { providerId } = await params;
  const data = await getDeezerAlbumPageData(providerId);

  return createPageMetadata({
    title: data?.album.title ?? "Album",
    description: data
      ? `Listen through ${data.album.title}${data.album.artist_name ? ` by ${data.album.artist_name}` : ""}.`
      : "Album context on Kocteau.",
    path: `/album/deezer/${providerId}`,
    image: data?.album.cover_url,
    noIndex: !data,
  });
}

export default async function DeezerAlbumPage({
  params,
}: {
  params: Promise<ProviderAlbumParams>;
}) {
  const { providerId } = await params;
  const localEntity = await getEntityPageByProvider("deezer", "album", providerId);

  if (localEntity) {
    permanentRedirect(buildEntityCanonicalPath(localEntity));
  }

  const data = await getDeezerAlbumPageData(providerId);

  if (!data) {
    notFound();
  }

  return (
    <CatalogEntityPage
      kind="Album"
      title={data.album.title}
      subtitle={data.album.artist_name}
      imageUrl={data.album.cover_url}
      details={[data.album.release_date?.slice(0, 4), data.album.record_type]}
      shelves={[
        {
          title: "Tracks",
          items: data.tracks.map((track) => ({
            provider: "deezer",
            providerId: track.provider_id,
            type: "track",
            title: track.title,
            artistName: track.artist_name,
            coverUrl: track.cover_url,
          })),
        },
      ]}
    />
  );
}
