"use client";

import type { AnalyticsEventInput } from "@/lib/validation/schemas";

type TrackAnalyticsEventOptions = AnalyticsEventInput;

const analyticsBatchSize = 20;
const analyticsFlushDelayMs = 300;
const pendingEvents: TrackAnalyticsEventOptions[] = [];
const pendingEventKeys = new Set<string>();
let flushTimeoutId: ReturnType<typeof setTimeout> | null = null;
let lifecycleListenersReady = false;

function getAnalyticsEventKey(event: TrackAnalyticsEventOptions) {
  return JSON.stringify(event);
}

function sendAnalyticsEvents(events: TrackAnalyticsEventOptions[]) {
  if (events.length === 0) {
    return;
  }

  const payload = JSON.stringify({ events });

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

function flushAnalyticsEvents() {
  if (flushTimeoutId) {
    clearTimeout(flushTimeoutId);
    flushTimeoutId = null;
  }

  while (pendingEvents.length > 0) {
    const events = pendingEvents.splice(0, analyticsBatchSize);
    events.forEach((event) => pendingEventKeys.delete(getAnalyticsEventKey(event)));
    sendAnalyticsEvents(events);
  }
}

function ensureLifecycleFlush() {
  if (lifecycleListenersReady || typeof window === "undefined") {
    return;
  }

  lifecycleListenersReady = true;
  window.addEventListener("pagehide", flushAnalyticsEvents);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushAnalyticsEvents();
    }
  });
}

export function trackAnalyticsEvent(event: TrackAnalyticsEventOptions) {
  const eventKey = getAnalyticsEventKey(event);

  if (pendingEventKeys.has(eventKey)) {
    return;
  }

  pendingEventKeys.add(eventKey);
  pendingEvents.push(event);
  ensureLifecycleFlush();

  if (pendingEvents.length >= analyticsBatchSize) {
    flushAnalyticsEvents();
    return;
  }

  if (!flushTimeoutId) {
    flushTimeoutId = setTimeout(flushAnalyticsEvents, analyticsFlushDelayMs);
  }
}
