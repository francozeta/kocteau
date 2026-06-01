"use client";

import { useEffect, useMemo } from "react";
import { useRouteHeader } from "@/components/route-header-context";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

type TrackPageHeaderBridgeProps = {
  entityId?: string | null;
  provider?: string | null;
  providerId?: string | null;
  type?: string | null;
  isAuthenticated?: boolean;
  sharePath?: string;
  title: string;
  artistName: string | null;
  deezerUrl: string | null;
};

export default function TrackPageHeaderBridge({
  entityId,
  provider,
  providerId,
  type,
  isAuthenticated = false,
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

  useEffect(() => {
    if (!isAuthenticated || !entityId) {
      return;
    }

    trackAnalyticsEvent({
      eventType: "entity_open",
      source: "track:page",
      metadata: {
        entity_id: entityId,
        provider: provider ?? null,
        provider_id: providerId ?? null,
        type: type ?? null,
      },
    });
  }, [entityId, isAuthenticated, provider, providerId, type]);

  return null;
}
