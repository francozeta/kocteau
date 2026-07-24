import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import ReactQueryProvider from "@/app/providers/react-query-provider";
import { circular, redaction } from "@/app/landing-fonts";
import GuestHeader from "@/components/guest-header";
import GuestHome from "@/components/guest-home";
import JsonLd from "@/components/json-ld";
import { createPageMetadata } from "@/lib/metadata";
import { measureServerTask } from "@/lib/perf";
import { getFeedPage } from "@/lib/queries/feed";
import { getPublicStarterTracks } from "@/lib/queries/starter";
import { createServerQueryClient } from "@/lib/react-query/server";
import {
  buildFeedPageJsonLd,
  buildHomePageJsonLd,
} from "@/lib/structured-data";
import { feedKeys, type FeedInfiniteQueryData } from "@/queries/feed";

export const revalidate = 300;

export const metadata = createPageMetadata({
  title: "Music reviews from real listeners",
  description:
    "Keep a record of what music leaves behind. Read track reviews, save listening notes, and discover music through people whose taste you trust.",
  path: "/",
});

export default async function HomePage() {
  const [publicBundle, starterTracks] = await measureServerTask(
    "getPublicHomeData",
    () =>
      Promise.all([
        getFeedPage({
          view: "latest",
          limit: 3,
          includeActiveUsers: false,
          revalidateSeconds: 5 * 60,
        }),
        getPublicStarterTracks({ limit: 6, contextKey: "home" }),
      ]),
    { route: "/" },
  );

  const recentPage = {
    ...publicBundle,
    activeUsers: [],
    nextCursor: null,
    requiresAuth: false,
  };
  const queryClient = createServerQueryClient();

  queryClient.setQueryData(feedKeys.bundle("latest"), recentPage);
  queryClient.setQueryData<FeedInfiniteQueryData>(feedKeys.infinite("latest"), {
    pages: [recentPage],
    pageParams: [null],
  });

  const feedStructuredData = buildFeedPageJsonLd(
    recentPage.feed.flatMap((review) => {
      const entity = review.entities;
      const author = review.author;

      if (!entity?.id || !author?.username) {
        return [];
      }

      return [
        {
          reviewId: review.id,
          reviewTitle: review.title,
          reviewBody: review.body,
          rating: review.rating,
          entity: {
            id: entity.id,
            provider: entity.provider,
            providerId: entity.provider_id,
            type: entity.type,
            title: entity.title,
            artistName: entity.artist_name,
            coverUrl: entity.cover_url,
          },
          author: {
            username: author.username,
            displayName: author.display_name,
          },
        },
      ];
    }),
  );

  return (
    <ReactQueryProvider>
      <div
        className={`${circular.variable} ${redaction.variable} kocteau-guest-typography kocteau-guest-grain min-h-svh overflow-x-clip bg-[var(--kocteau-landing-canvas)] text-foreground`}
      >
        <GuestHeader />
        <main className="pt-15 sm:pt-16">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <JsonLd data={buildHomePageJsonLd()} id="home-page-structured-data" />
            <JsonLd data={feedStructuredData} id="home-structured-data" />
            <GuestHome recentPage={recentPage} starterTracks={starterTracks} />
          </HydrationBoundary>
        </main>
      </div>
    </ReactQueryProvider>
  );
}
