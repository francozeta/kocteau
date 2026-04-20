"use client";

import { useEffect, useMemo } from "react";
import { useRouteHeader } from "@/components/route-header-context";

type TrackPageHeaderBridgeProps = {
  entityId?: string | null;
  sharePath?: string;
  title: string;
  artistName: string | null;
  deezerUrl: string | null;
};

export default function TrackPageHeaderBridge({
  entityId,
  sharePath,
  title,
  artistName,
  deezerUrl,
}: TrackPageHeaderBridgeProps) {
  const { setDetailHeader } = useRouteHeader();
  const resolvedSharePath = sharePath ?? (entityId ? `/track/${entityId}` : null);
  const externalLinks = useMemo(
    () =>
      deezerUrl
        ? [
            {
              label: "Open in Deezer",
              url: deezerUrl,
            },
          ]
        : [],
    [deezerUrl],
  );

  useEffect(() => {
    if (!resolvedSharePath) {
      return;
    }

    setDetailHeader({
      kind: "track",
      title,
      shareLabel: artistName?.trim() ? `${title} — ${artistName}` : title,
      sharePath: resolvedSharePath,
      externalLinks,
    });

    return () => {
      setDetailHeader(null);
    };
  }, [artistName, externalLinks, resolvedSharePath, setDetailHeader, title]);

  return null;
}
