"use client";

import { useEffect } from "react";
import { useRouteHeader } from "@/components/route-header-context";

type ReviewPageHeaderBridgeProps = {
  reviewId: string;
  title: string;
  entityTitle?: string | null;
  artistName?: string | null;
};

export default function ReviewPageHeaderBridge({
  reviewId,
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
      sharePath: `/review/${reviewId}`,
      externalLinks: [],
    });

    return () => {
      setDetailHeader(null);
    };
  }, [artistName, entityTitle, reviewId, setDetailHeader, title]);

  return null;
}
