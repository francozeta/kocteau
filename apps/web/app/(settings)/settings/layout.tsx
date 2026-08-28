import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import SettingsNavigation from "@/components/settings-navigation";
import { getCurrentViewerProfile } from "@/lib/auth/server";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentViewerProfile();

  if (!profile) {
    redirect("/login?next=/settings/profile");
  }

  return (
    <div className="min-h-svh bg-[var(--kocteau-canvas)] md:flex md:h-svh md:overflow-hidden">
      <SettingsNavigation />
      <div className="min-w-0 flex-1 md:p-2.5 md:pl-0">
        <div className="min-h-svh bg-[var(--kocteau-canvas)] md:h-full md:min-h-0 md:overflow-hidden md:rounded-[0.8rem] md:border md:border-[var(--kocteau-line-soft)] md:bg-[var(--kocteau-shell)]">
          <main className="no-scrollbar min-h-0 md:h-full md:scroll-fade-y md:overflow-y-auto md:[--scroll-fade-reveal:2.5rem] md:[--scroll-fade-size:1.25rem]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
