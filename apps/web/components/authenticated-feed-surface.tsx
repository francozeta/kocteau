"use client";

import { useCallback, useEffect, useState } from "react";
import FeedReviewList from "@/components/feed-review-list";
import FeedViewTabs from "@/components/feed-view-tabs";
import {
  getAuthenticatedFeedView,
  getFeedViewHref,
  type FeedView,
} from "@/lib/feed-view";
import type { CurrentViewerProfile } from "@/lib/auth/server";
import type { StarterTrack } from "@/lib/starter";
import type { FeedBundleQueryData } from "@/queries/feed";

type AuthenticatedFeedSurfaceProps = {
  initialView: Exclude<FeedView, "latest">;
  initialPage: FeedBundleQueryData;
  viewer: CurrentViewerProfile | null;
  starterTracks: StarterTrack[];
};

function readViewFromLocation() {
  const params = new URLSearchParams(window.location.search);
  return getAuthenticatedFeedView(params.get("view"));
}

export default function AuthenticatedFeedSurface({
  initialView,
  initialPage,
  viewer,
  starterTracks,
}: AuthenticatedFeedSurfaceProps) {
  const [activeView, setActiveView] = useState(initialView);

  useEffect(() => {
    const handlePopState = () => setActiveView(readViewFromLocation());

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleViewChange = useCallback(
    (view: FeedView) => {
      const nextView = getAuthenticatedFeedView(view);

      if (nextView === activeView) {
        return;
      }

      window.history.pushState(null, "", getFeedViewHref(nextView));
      setActiveView(nextView);

      document
        .querySelector<HTMLElement>("[data-kocteau-scroll-main]")
        ?.scrollTo({ top: 0, behavior: "instant" });
    },
    [activeView],
  );

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6 lg:mx-0 lg:max-w-none lg:space-y-4">
      <div className="lg:hidden">
        <FeedViewTabs
          activeView={activeView}
          fullWidth
          onViewChange={handleViewChange}
        />
      </div>
      <div className="hidden justify-start lg:flex">
        <FeedViewTabs
          activeView={activeView}
          onViewChange={handleViewChange}
        />
      </div>
      <div className="space-y-4">
        <FeedReviewList
          view={activeView}
          initialPage={activeView === initialView ? initialPage : undefined}
          isAuthenticated
          viewer={viewer}
          starterTracks={starterTracks}
          showReviewCta={false}
        />
      </div>
    </section>
  );
}
