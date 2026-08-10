import Link from "next/link";
import { redirect } from "next/navigation";
import {
  KocteauAlbumIcon,
  KocteauArtistIcon,
  KocteauBookmarkIcon,
  KocteauSongIcon,
} from "@/components/kocteau-icons";
import { getCurrentUserId } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { getViewerEntityLibraryItems } from "@/lib/queries/entity-library";
import { getViewerSavedReviewsBundle } from "@/lib/queries/viewer";

export const metadata = createPageMetadata({
  title: "Library",
  description: "Your private music library on Kocteau.",
  path: "/library",
  noIndex: true,
});

export default async function LibraryPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login?next=%2Flibrary");
  }

  const [libraryItems, { reviews }] = await Promise.all([
    getViewerEntityLibraryItems(userId),
    getViewerSavedReviewsBundle(userId),
  ]);
  const destinations = [
    {
      href: "/library/songs",
      label: "Songs",
      description: "Tracks you kept close.",
      count: libraryItems.tracks.length,
      icon: KocteauSongIcon,
    },
    {
      href: "/library/albums",
      label: "Albums",
      description: "Records saved as a whole.",
      count: libraryItems.albums.length,
      icon: KocteauAlbumIcon,
    },
    {
      href: "/library/artists",
      label: "Artists",
      description: "Artists present in your library.",
      count: libraryItems.artists.length,
      icon: KocteauArtistIcon,
    },
    {
      href: "/library/bookmarked",
      label: "Bookmarked",
      description: "Reviews worth returning to.",
      count: reviews.length,
      icon: KocteauBookmarkIcon,
    },
  ];

  return (
    <section className="w-full max-w-3xl space-y-7 sm:space-y-8">
      <header className="space-y-1.5">
        <h1 className="font-heading text-[2rem] font-medium tracking-tight text-foreground sm:text-[2.35rem]">
          Library
        </h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Your music, separated into quiet collections.
        </p>
      </header>

      <nav aria-label="Library categories" className="grid gap-3 sm:grid-cols-2">
        {destinations.map((destination) => {
          const Icon = destination.icon;

          return (
            <Link
              key={destination.href}
              href={destination.href}
              className="group flex min-h-16 items-center gap-3 rounded-full bg-white/[0.08] p-2 pe-4 transition-[transform,background-color] duration-150 hover:bg-white/[0.12] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/[0.14] text-foreground">
                <Icon className="size-5" weight="fill" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{destination.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{destination.description}</span>
              </span>
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {destination.count}
              </span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
