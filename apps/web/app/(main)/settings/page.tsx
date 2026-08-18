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
    <section className="mx-auto w-full max-w-[42rem] pb-8 sm:pb-12">
      <header className="mb-8 space-y-1.5 sm:mb-10">
        <h1 className="font-pixel text-[1.35rem] font-medium tracking-[-0.025em] text-foreground">
          Settings
        </h1>
        <p className="max-w-md text-sm leading-5 text-muted-foreground">
          Shape how your profile appears across Kocteau.
        </p>
      </header>
      <ProfileEditorForm
        mode="settings"
        initialProfile={profile}
        settingsLayout="page"
      />
    </section>
  );
}
