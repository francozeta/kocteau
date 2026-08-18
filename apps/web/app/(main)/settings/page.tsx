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
    <section className="mx-auto w-full max-w-[64rem] pb-8 sm:pb-12">
      <header className="mb-7 space-y-1.5 sm:mb-9">
        <h1 className="font-pixel text-[1.35rem] font-medium tracking-[-0.025em] text-foreground">
          Settings
        </h1>
        <p className="text-sm leading-5 text-muted-foreground">Profile, identity, and music links.</p>
      </header>

      <div className="grid items-start gap-8 md:grid-cols-[10.5rem_minmax(0,1fr)] md:gap-12 lg:gap-16">
        <nav
          aria-label="Settings sections"
          className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 md:sticky md:top-5 md:mx-0 md:flex-col md:overflow-visible md:px-0"
        >
          <a
            href="#profile-settings-section-profile"
            className="flex h-9 shrink-0 items-center rounded-[0.58rem] bg-foreground/[0.07] px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65"
          >
            Profile
          </a>
          <a
            href="#profile-settings-section-links"
            className="flex h-9 shrink-0 items-center rounded-[0.58rem] px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.045] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65"
          >
            Music links
          </a>
        </nav>

        <div className="min-w-0 max-w-[42rem]">
          <ProfileEditorForm
            mode="settings"
            initialProfile={profile}
            settingsLayout="page"
          />
        </div>
      </div>
    </section>
  );
}
