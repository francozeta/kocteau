"use client";

import { useEffect } from "react";
import { useRouteHeader } from "@/components/route-header-context";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

type ReviewPageHeaderBridgeProps = {
  reviewId: string;
  entityId?: string | null;
  isAuthenticated?: boolean;
  sharePath?: string;
  title: string;
  entityTitle?: string | null;
  artistName?: string | null;
};

export default function ReviewPageHeaderBridge({
  reviewId,
  entityId,
  isAuthenticated = false,
  sharePath,
  title,
  entityTitle,
  artistName,
}: ReviewPageHeaderBridgeProps) {
  const { setDetailHeader } = useRouteHeader();

  useEffect(() => {
    const trackLabel = entityTitle
      ? artistName?.trim()
        ? `${entityTitle} — ${artistName}`
        : entityTitle
      : "Review";

    setDetailHeader({
      kind: "review",
      title,
      shareLabel: title.trim() || trackLabel,
      sharePath: sharePath ?? `/review/${reviewId}`,
      externalLinks: [],
    });

    return () => {
      setDetailHeader(null);
    };
  }, [artistName, entityTitle, reviewId, setDetailHeader, sharePath, title]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    trackAnalyticsEvent({
      eventType: "review_open",
      source: "review:page",
      metadata: {
        review_id: reviewId,
        entity_id: entityId ?? null,
      },
    });
  }, [entityId, isAuthenticated, reviewId]);

  return null;
}
