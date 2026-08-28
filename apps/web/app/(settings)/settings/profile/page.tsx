import { redirect } from "next/navigation";

import ProfileEditorForm from "@/components/profile-editor-form";
import SettingsPageFrame from "@/components/settings-page-frame";
import { getCurrentViewerProfile } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Profile settings",
  description: "Manage your public identity on Kocteau.",
  path: "/settings/profile",
  noIndex: true,
});

export default async function ProfileSettingsPage() {
  const profile = await getCurrentViewerProfile();

  if (!profile) {
    redirect("/login?next=/settings/profile");
  }

  return (
    <SettingsPageFrame
      title="Profile"
      description="Manage the identity and byline listeners see across Kocteau."
    >
      <ProfileEditorForm
        mode="settings"
        initialProfile={profile}
        settingsLayout="page"
        settingsSection="profile"
      />
    </SettingsPageFrame>
  );
}
