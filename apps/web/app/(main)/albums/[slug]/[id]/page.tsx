import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CatalogEntityPage from "@/components/catalog-entity-page";
import { getAlbumPageData } from "@/lib/catalog/page-data";
import { createPageMetadata } from "@/lib/metadata";
import { getEntityPageByRouteId } from "@/lib/queries/entities";
import { buildEntityCanonicalPath, isSeoRouteId } from "@/lib/seo-routes";

type AlbumRouteParams = { slug: string; id: string };

function routePath({ slug, id }: AlbumRouteParams) {
  return `/albums/${slug}/${id}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<AlbumRouteParams>;
}): Promise<Metadata> {
  const routeParams = await params;
  const entity = isSeoRouteId(routeParams.id)
    ? await getEntityPageByRouteId(routeParams.id)
    : null;

  if (!entity || entity.type !== "album") {
    return createPageMetadata({
      title: "Album",
      description: "Album context and listening notes on Kocteau.",
      path: routePath(routeParams),
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: entity.artist_name
      ? `${entity.title} — ${entity.artist_name}`
      : entity.title,
    description: `Tracks, context, and reviews for ${entity.title}${entity.artist_name ? ` by ${entity.artist_name}` : ""}.`,
    path: buildEntityCanonicalPath(entity),
    image: entity.cover_url,
  });
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<AlbumRouteParams>;
}) {
  const routeParams = await params;

  if (!isSeoRouteId(routeParams.id)) {
    notFound();
  }

  const entity = await getEntityPageByRouteId(routeParams.id);

  if (!entity) {
    notFound();
  }

  const canonicalPath = buildEntityCanonicalPath(entity);

  if (entity.type !== "album" || canonicalPath !== routePath(routeParams)) {
    permanentRedirect(canonicalPath);
  }

  const data = await getAlbumPageData(entity);

  return (
    <CatalogEntityPage
      kind="Album"
      title={data.title}
      subtitle={data.artistName}
      imageUrl={data.coverUrl}
      details={[
        data.releaseDate?.slice(0, 4),
        data.recordType,
        data.genres.slice(0, 3).join(" · "),
      ]}
      context={entity.disambiguation}
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
