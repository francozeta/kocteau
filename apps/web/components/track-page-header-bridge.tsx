"use client";

import { useEffect } from "react";
import { useRouteHeader } from "@/components/route-header-context";

type TrackPageHeaderBridgeProps = {
  entityId: string;
  title: string;
  artistName: string | null;
  deezerUrl: string | null;
};

export default function TrackPageHeaderBridge({
  entityId,
  title,
  artistName,
  deezerUrl,
}: TrackPageHeaderBridgeProps) {
  const { setDetailHeader } = useRouteHeader();

  useEffect(() => {
    setDetailHeader({
      kind: "track",
      title,
      shareLabel: artistName?.trim() ? `${title} — ${artistName}` : title,
      sharePath: `/track/${entityId}`,
      externalLinks: deezerUrl
        ? [
            {
              label: "Open in Deezer",
              url: deezerUrl,
            },
          ]
        : [],
    });

    return () => {
      setDetailHeader(null);
    };
  }, [artistName, deezerUrl, entityId, setDetailHeader, title]);

  return null;
}
