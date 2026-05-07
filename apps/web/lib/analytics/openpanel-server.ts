import "server-only";

import {
  OpenPanelBase,
  type TrackProperties,
} from "@openpanel/nextjs";
import type { AnalyticsEventInput } from "@/lib/validation/schemas";

type OpenPanelServerClient = InstanceType<typeof OpenPanelBase>;

type TrackOpenPanelServerEventOptions = AnalyticsEventInput & {
  profileId: string;
};

let openPanelServerClient: OpenPanelServerClient | null | undefined;

function getOpenPanelServerClient() {
  if (openPanelServerClient !== undefined) {
    return openPanelServerClient;
  }

  const clientId = process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID?.trim();
  const clientSecret = process.env.OPENPANEL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    openPanelServerClient = null;
    return openPanelServerClient;
  }

  const apiUrl = process.env.OPENPANEL_API_URL?.trim() || undefined;

  openPanelServerClient = new OpenPanelBase({
    apiUrl,
    clientId,
    clientSecret,
    sdk: "kocteau-web-server",
  });

  return openPanelServerClient;
}

export async function trackOpenPanelServerEvent({
  profileId,
  eventType,
  source,
  metadata,
}: TrackOpenPanelServerEventOptions) {
  const openPanel = getOpenPanelServerClient();

  if (!openPanel) {
    return;
  }

  const properties = {
    ...metadata,
    source,
    profileId,
  } satisfies TrackProperties;

  try {
    await openPanel.track(eventType, properties);
  } catch (error) {
    console.warn("[analytics.trackOpenPanelServerEvent] skipped", {
      eventType,
      source,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
