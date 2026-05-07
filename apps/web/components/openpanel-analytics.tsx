import {
  IdentifyComponent,
  OpenPanelComponent,
} from "@openpanel/nextjs";

const openPanelClientId = process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID?.trim();
const openPanelDisabled =
  process.env.NEXT_PUBLIC_OPENPANEL_DISABLED === "true" ||
  process.env.NODE_ENV === "test";

export default function OpenPanelAnalytics() {
  if (!openPanelClientId || openPanelDisabled) {
    return null;
  }

  return (
    <OpenPanelComponent
      apiUrl="/api/op"
      scriptUrl="/api/op/op1.js"
      clientId={openPanelClientId}
      trackScreenViews={true}
      globalProperties={{
        app: "kocteau",
        environment:
          process.env.NEXT_PUBLIC_VERCEL_ENV ??
          process.env.NODE_ENV ??
          "development",
      }}
    />
  );
}

export function OpenPanelIdentify({ profileId }: { profileId: string }) {
  if (!openPanelClientId || openPanelDisabled) {
    return null;
  }

  return <IdentifyComponent profileId={profileId} />;
}
