import { redirect } from "next/navigation";
import { KocteauAlbumIcon } from "@/components/kocteau-icons";
import LibraryEntityGrid from "@/components/library-entity-grid";
import LibraryRouteHeader from "@/components/library-route-header";
import { getCurrentUserId } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { getViewerEntityLibraryItems } from "@/lib/queries/entity-library";

export const metadata = createPageMetadata({
  title: "Albums — Library",
  description: "Albums saved to your Kocteau library.",
  path: "/library/albums",
  noIndex: true,
});

export default async function LibraryAlbumsPage() {
  const userId = await getCurrentUserId();

  if (!userId) redirect("/login?next=%2Flibrary%2Falbums");

  const { albums } = await getViewerEntityLibraryItems(userId);
  const items = albums.flatMap((item) =>
    item.entity
      ? [
          {
            id: item.entity.id,
            href: item.entity.href,
            title: item.entity.title,
            subtitle: item.entity.artist_name,
            coverUrl: item.entity.cover_url,
          },
        ]
      : [],
  );

  return (
    <section className="w-full max-w-5xl space-y-7 sm:space-y-8">
      <LibraryRouteHeader
        title="Albums"
        description="Records you saved as a complete listen."
        count={items.length}
      />
      <LibraryEntityGrid
        items={items}
        emptyTitle="No albums yet"
        emptyDescription="Save an album when the whole record deserves a place here."
        emptyIcon={<KocteauAlbumIcon className="size-4" />}
      />
    </section>
  );
}
