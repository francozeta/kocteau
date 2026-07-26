import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CatalogEntityPage from "@/components/catalog-entity-page";
import { getArtistPageData } from "@/lib/catalog/page-data";
import { createPageMetadata } from "@/lib/metadata";
import { getArtistPageByRouteId } from "@/lib/queries/artists";
import { buildEntityCanonicalPath, isSeoRouteId } from "@/lib/seo-routes";

type ArtistRouteParams = { slug: string; id: string };

function routePath({ slug, id }: ArtistRouteParams) {
  return `/artists/${slug}/${id}`;
}

function getCanonicalPath(artist: Awaited<ReturnType<typeof getArtistPageByRouteId>>) {
  if (!artist) {
    return null;
  }

  return buildEntityCanonicalPath({
    id: artist.id,
    provider: artist.provider,
    provider_id: artist.provider_id,
    type: "artist",
    title: artist.name,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ArtistRouteParams>;
}): Promise<Metadata> {
  const routeParams = await params;
  const artist = isSeoRouteId(routeParams.id)
    ? await getArtistPageByRouteId(routeParams.id)
    : null;

  if (!artist) {
    return createPageMetadata({
      title: "Artist",
      description: "Artist context and music discovery on Kocteau.",
      path: routePath(routeParams),
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: artist.name,
    description: `Tracks, releases, and listener context for ${artist.name}.`,
    path: getCanonicalPath(artist) ?? routePath(routeParams),
    image: artist.image_url,
  });
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<ArtistRouteParams>;
}) {
  const routeParams = await params;

  if (!isSeoRouteId(routeParams.id)) {
    notFound();
  }

  const artist = await getArtistPageByRouteId(routeParams.id);

  if (!artist) {
    notFound();
  }

  const canonicalPath = getCanonicalPath(artist);

  if (!canonicalPath) {
    notFound();
  }

  if (canonicalPath !== routePath(routeParams)) {
    permanentRedirect(canonicalPath);
  }

  const data = await getArtistPageData(artist);

  return (
    <CatalogEntityPage
      kind="Artist"
      title={data.artist.name}
      imageUrl={data.artist.picture_url}
      details={[
        artist.artist_type,
        artist.country_code,
        artist.genres.slice(0, 3).join(" · "),
      ]}
      context={artist.disambiguation}
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
