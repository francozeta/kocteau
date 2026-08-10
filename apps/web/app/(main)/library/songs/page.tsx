import { redirect } from "next/navigation";
import { KocteauSongIcon } from "@/components/kocteau-icons";
import LibraryEntityGrid from "@/components/library-entity-grid";
import LibraryRouteHeader from "@/components/library-route-header";
import { getCurrentUserId } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { getViewerEntityLibraryItems } from "@/lib/queries/entity-library";

export const metadata = createPageMetadata({
  title: "Songs — Library",
  description: "Songs saved to your Kocteau library.",
  path: "/library/songs",
  noIndex: true,
});

export default async function LibrarySongsPage() {
  const userId = await getCurrentUserId();

  if (!userId) redirect("/login?next=%2Flibrary%2Fsongs");

  const { tracks } = await getViewerEntityLibraryItems(userId);
  const items = tracks.flatMap((item) =>
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
        title="Songs"
        description="Tracks you added to your Kocteau library."
        count={items.length}
      />
      <LibraryEntityGrid
        items={items}
        emptyTitle="No songs yet"
        emptyDescription="Add a song when it feels worth keeping close."
        emptyIcon={<KocteauSongIcon className="size-4" />}
      />
    </section>
  );
}
