"use client";

import { useEffect } from "react";
import { useRouteHeader } from "@/components/route-header-context";

type TrackPageHeaderBridgeProps = {
  title: string;
  artistName: string | null;
  deezerUrl: string | null;
};

export default function TrackPageHeaderBridge({
  title,
  artistName,
  deezerUrl,
}: TrackPageHeaderBridgeProps) {
  const { setTrackHeader } = useRouteHeader();

  useEffect(() => {
    setTrackHeader({
      title,
      artistName,
      deezerUrl,
    });

    return () => {
      setTrackHeader(null);
    };
  }, [artistName, deezerUrl, setTrackHeader, title]);

  return null;
}
