import { redirect } from "next/navigation";
import { KocteauArtistIcon } from "@/components/kocteau-icons";
import LibraryEntityGrid from "@/components/library-entity-grid";
import LibraryRouteHeader from "@/components/library-route-header";
import { getCurrentUserId } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { getViewerEntityLibraryItems } from "@/lib/queries/entity-library";

export const metadata = createPageMetadata({
  title: "Artists — Library",
  description: "Artists represented in your Kocteau library.",
  path: "/library/artists",
  noIndex: true,
});

export default async function LibraryArtistsPage() {
  const userId = await getCurrentUserId();

  if (!userId) redirect("/login?next=%2Flibrary%2Fartists");

  const { artists } = await getViewerEntityLibraryItems(userId);
  const items = artists.map(({ artist }) => ({
    id: artist.id,
    href: artist.href,
    title: artist.name,
    subtitle: "Artist",
    coverUrl: artist.image_url,
  }));

  return (
    <section className="w-full max-w-5xl space-y-7 sm:space-y-8">
      <LibraryRouteHeader
        title="Artists"
        description="Artists connected to the music you saved."
        count={items.length}
      />
      <LibraryEntityGrid
        items={items}
        emptyTitle="No artists yet"
        emptyDescription="Artists will appear as you add their songs and albums."
        emptyIcon={<KocteauArtistIcon className="size-4" />}
      />
    </section>
  );
}
