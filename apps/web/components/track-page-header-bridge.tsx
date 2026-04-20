"use client";

import { useEffect, useMemo } from "react";
import { useRouteHeader } from "@/components/route-header-context";
import type { EntityExternalLink } from "@/lib/queries/entities";

type TrackPageHeaderBridgeProps = {
  entityId?: string | null;
  sharePath?: string;
  title: string;
  artistName: string | null;
  deezerUrl: string | null;
  links?: EntityExternalLink[];
};

export default function TrackPageHeaderBridge({
  entityId,
  sharePath,
  title,
  artistName,
  deezerUrl,
  links,
}: TrackPageHeaderBridgeProps) {
  const { setDetailHeader } = useRouteHeader();
  const resolvedSharePath = sharePath ?? (entityId ? `/track/${entityId}` : null);
  const externalLinks = useMemo(
    () =>
      links && links.length > 0
        ? links.map((link) => ({
            label: `Open in ${link.label}`,
            url: link.url,
          }))
        : deezerUrl
          ? [
              {
                label: "Open in Deezer",
                url: deezerUrl,
              },
            ]
          : [],
    [deezerUrl, links],
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
