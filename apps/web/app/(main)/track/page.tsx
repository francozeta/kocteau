import Link from "next/link";
import { ArrowRight, Music2 } from "lucide-react";
import PrefetchLink from "@/components/prefetch-link";
import TrackContextMenu from "@/components/track-context-menu";
import { buttonVariants } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { createPageMetadata } from "@/lib/metadata";
import { getRecentlyDiscussedTracks } from "@/lib/queries/discovery";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

export const metadata = createPageMetadata({
  title: "Track Index",
  description: "Browse tracks with recent review activity inside Kocteau.",
  path: "/track",
});

export default async function TrackIndexPage() {
  const tracks = await getRecentlyDiscussedTracks(12);

  return (
    <section className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
      <div className="border-b border-border/30 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Explore
            </p>
            <h1 className="text-[1.95rem] font-semibold tracking-tight sm:text-[2.2rem]">
              Track Index
            </h1>
            <p className="text-sm text-muted-foreground">
              {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/search"
              className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-full border-border/30")}
            >
              Explore
            </Link>
            <PrefetchLink
              href="/"
              queryWarmup={{ kind: "feed" }}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
            >
              Feed
            </PrefetchLink>
          </div>
        </div>
      </div>

      {tracks.length > 0 ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {tracks.map((track) => (
            <TrackContextMenu
              key={track.entityId}
              href={`/track/${track.entityId}`}
              title={track.title}
              artistName={track.artistName}
            >
              <PrefetchLink
                href={`/track/${track.entityId}`}
                queryWarmup={{ kind: "track", id: track.entityId }}
                className="group flex items-center gap-4 rounded-[1.65rem] border border-border/20 bg-card/20 px-3.5 py-3.5 transition-colors hover:bg-card/35"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] bg-muted">
                  {track.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Music2 className="size-5 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h2 className="line-clamp-1 text-base font-medium text-foreground">
                    {track.title}
                  </h2>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {track.artistName ?? "Unknown artist"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(track.latestReviewAt)}</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </PrefetchLink>
            </TrackContextMenu>
          ))}
        </div>
      ) : (
        <Empty className="rounded-[1.75rem] border-border/25 bg-card/20 px-6 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Music2 className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No tracks yet</EmptyTitle>
            <EmptyDescription>
              Search for a track and publish the first review.
            </EmptyDescription>
          </EmptyHeader>
          <CardContent className="p-0 pt-2">
            <Link
              href="/search"
              className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-full border-border/30")}
            >
              Explore
            </Link>
          </CardContent>
        </Empty>
      )}
    </section>
  );
}
