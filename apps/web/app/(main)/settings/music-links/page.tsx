import { redirect } from "next/navigation";

import ProfileEditorForm from "@/components/profile-editor-form";
import SettingsPageFrame from "@/components/settings-page-frame";
import { getCurrentViewerProfile } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Music links",
  description: "Manage the music services linked from your Kocteau profile.",
  path: "/settings/music-links",
  noIndex: true,
});

export default async function MusicLinksSettingsPage() {
  const profile = await getCurrentViewerProfile();

  if (!profile) {
    redirect("/login?next=/settings/music-links");
  }

  return (
    <SettingsPageFrame
      title="Music links"
      description="Add the listening profiles you want people to find from your page."
    >
      <ProfileEditorForm
        mode="settings"
        initialProfile={profile}
        settingsLayout="page"
        settingsSection="links"
      />
    </SettingsPageFrame>
  );
}
