import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Bookmark, ChevronRight } from "@/components/ui/icons";
import { redirect } from "next/navigation";
import PrefetchLink from "@/components/prefetch-link";
import SavedReviewsList from "@/components/saved-reviews-list";
import TrackTile from "@/components/track-tile";
import { buttonVariants } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getCurrentUserId, getCurrentViewerProfile } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import {
  getViewerEntityLibraryItems,
  type ViewerEntityLibraryItem,
} from "@/lib/queries/entity-library";
import { getViewerSavedReviewsBundle } from "@/lib/queries/viewer";
import { cn } from "@/lib/utils";

export const metadata = createPageMetadata({
  title: "Library",
  description: "Private track library and saved reviews on Kocteau.",
  path: "/library",
  noIndex: true,
});

export default async function LibraryPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  const [{ reviews: savedReviews }, libraryItems] = await Promise.all([
    getViewerSavedReviewsBundle(userId),
    getViewerEntityLibraryItems(userId),
  ]);
  const libraryCount = savedReviews.length + libraryItems.tracks.length;

  return (
    <section className="w-full max-w-5xl space-y-7 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-heading text-[2rem] font-medium tracking-tight text-foreground sm:text-[2.35rem]">
            Library
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Tracks you want to keep close, and writing worth coming back to.
          </p>
          <p className="text-xs font-medium text-muted-foreground/80">
            {libraryCount} {libraryCount === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Suspense fallback={null}>
            <LibraryProfileAction userId={userId} />
          </Suspense>
          <Link
            href="/search"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-full border-border/24 bg-card/18 hover:border-border/40 hover:bg-card/26",
            )}
          >
            Explore
          </Link>
        </div>
      </div>

      <LibraryTrackShelf
        title="Tracks"
        description="Music you added to your Kocteau library."
        items={libraryItems.tracks}
        emptyTitle="No tracks in your library yet"
        emptyDescription="Add a track to your library when it feels worth keeping close."
        emptyIcon={<Bookmark className="size-4" />}
      />

      <section className="space-y-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">
              Saved reviews
            </h2>
            <p className="text-xs text-muted-foreground">
              Reviews you want to revisit.
            </p>
          </div>
          <p className="text-xs tabular-nums text-muted-foreground">
            {savedReviews.length}
          </p>
        </div>

        <SavedReviewsList
          initialReviews={savedReviews}
          userId={userId}
          isAuthenticated
          emptyState={
            <Empty className="rounded-[1.35rem] border-border/22 bg-card/14 px-6 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bookmark className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No saved reviews yet</EmptyTitle>
                <EmptyDescription>Save reviews you want to revisit.</EmptyDescription>
              </EmptyHeader>
              <CardContent className="p-0 pt-2">
                <PrefetchLink
                  href="/feed"
                  queryWarmup={{ kind: "feed" }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  Go to the feed
                  <ChevronRight className="size-4" />
                </PrefetchLink>
              </CardContent>
            </Empty>
          }
        />
      </section>
    </section>
  );
}

function LibraryTrackShelf({
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
  emptyIcon,
}: {
  title: string;
  description: string;
  items: ViewerEntityLibraryItem[];
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon: ReactNode;
}) {
  const visibleItems = items.filter((item) => item.entity);

  return (
    <section className="space-y-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">
          {visibleItems.length}
        </p>
      </div>

      {visibleItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visibleItems.map((item) => {
            if (!item.entity) {
              return null;
            }

            return (
              <TrackTile
                key={`${item.item_type}-${item.entity.id}`}
                href={item.entity.href}
                title={item.entity.title}
                artistName={item.entity.artist_name}
                coverUrl={item.entity.cover_url}
                sizes="(min-width: 1024px) 156px, (min-width: 640px) 28vw, 46vw"
                quality={86}
              />
            );
          })}
        </div>
      ) : (
        <Empty className="rounded-[1.35rem] border-border/22 bg-card/14 px-6 py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {emptyIcon}
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
}

async function LibraryProfileAction({ userId }: { userId: string }) {
  const profile = await getCurrentViewerProfile();

  if (!profile?.username || profile.id !== userId) {
    return null;
  }

  return (
    <PrefetchLink
      href={`/u/${profile.username}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "rounded-full bg-card/12 hover:bg-card/22",
      )}
    >
      Profile
    </PrefetchLink>
  );
}
