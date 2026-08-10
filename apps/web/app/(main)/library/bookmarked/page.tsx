import { redirect } from "next/navigation";
import { KocteauBookmarkIcon } from "@/components/kocteau-icons";
import LibraryRouteHeader from "@/components/library-route-header";
import PrefetchLink from "@/components/prefetch-link";
import SavedReviewsList from "@/components/saved-reviews-list";
import { CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getCurrentUserId } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { getViewerSavedReviewsBundle } from "@/lib/queries/viewer";

export const metadata = createPageMetadata({
  title: "Bookmarked — Library",
  description: "Reviews bookmarked in your Kocteau library.",
  path: "/library/bookmarked",
  noIndex: true,
});

export default async function LibraryBookmarkedPage() {
  const userId = await getCurrentUserId();

  if (!userId) redirect("/login?next=%2Flibrary%2Fbookmarked");

  const { reviews } = await getViewerSavedReviewsBundle(userId);

  return (
    <section className="w-full max-w-3xl space-y-7 sm:space-y-8">
      <LibraryRouteHeader
        title="Bookmarked"
        description="Reviews you want to revisit."
        count={reviews.length}
      />
      <SavedReviewsList
        initialReviews={reviews}
        userId={userId}
        isAuthenticated
        emptyState={
          <Empty className="rounded-[1.35rem] border-border/22 bg-card/14 px-6 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <KocteauBookmarkIcon className="size-4" weight="fill" />
              </EmptyMedia>
              <EmptyTitle>No bookmarked reviews yet</EmptyTitle>
              <EmptyDescription>Bookmark reviews you want to revisit.</EmptyDescription>
            </EmptyHeader>
            <CardContent className="p-0 pt-2">
              <PrefetchLink
                href="/feed"
                queryWarmup={{ kind: "feed" }}
                className="inline-flex min-h-10 items-center rounded-full bg-white/[0.08] px-4 text-sm font-medium text-foreground transition-[transform,background-color] duration-150 hover:bg-white/[0.12] active:scale-[0.96]"
              >
                Go to the feed
              </PrefetchLink>
            </CardContent>
          </Empty>
        }
      />
    </section>
  );
}
