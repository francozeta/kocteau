"use client";

import type { AnalyticsEventInput } from "@/lib/validation/schemas";

type TrackAnalyticsEventOptions = AnalyticsEventInput;

export function trackAnalyticsEvent(event: TrackAnalyticsEventOptions) {
  const payload = JSON.stringify(event);

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const sent = navigator.sendBeacon(
      "/api/analytics/events",
      new Blob([payload], { type: "application/json" }),
    );

    if (sent) {
      return;
    }
  }

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt product interactions.
  });
}
