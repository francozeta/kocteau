import { redirect } from "next/navigation";

import ProfileEditorForm from "@/components/profile-editor-form";
import { getCurrentViewerProfile } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Settings",
  description: "Manage your Kocteau profile and music links.",
  path: "/settings",
  noIndex: true,
});

export default async function SettingsPage() {
  const profile = await getCurrentViewerProfile();

  if (!profile) {
    redirect("/login?next=/settings");
  }

  return (
    <section className="mx-auto w-full max-w-[45rem] pb-8 sm:pb-12">
      <h1 className="sr-only">Settings</h1>
      <ProfileEditorForm
        mode="settings"
        initialProfile={profile}
        settingsLayout="page"
      />
    </section>
  );
}
