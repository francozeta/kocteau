import { redirect } from "next/navigation";
import ReactQueryProvider from "../providers/react-query-provider";
import Header from "@/components/header";
import AppSidebar from "@/components/app-sidebar";
import GlobalShortcuts from "@/components/global-shortcuts";
import MobileBottomBar from "@/components/mobile-bottom-bar";
import { RouteHeaderProvider } from "@/components/route-header-context";
import WhoToFollowRail from "@/components/who-to-follow-rail";
import { getCurrentOnboardingState, getCurrentUser, getCurrentViewerProfile } from "@/lib/auth/server";
import { getStarterCuratorAccess } from "@/lib/queries/curation";
import { getStarterTracks } from "@/lib/queries/starter";
import type { SidebarOwnedReview } from "@/lib/types/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const [user, safeProfile, onboardingState] = await Promise.all([
    getCurrentUser(),
    getCurrentViewerProfile(),
    getCurrentOnboardingState(),
  ]);
  const initialUnreadCount = 0;
  const ownedReviews: SidebarOwnedReview[] = [];

  if (user && onboardingState && !onboardingState.profileOnboarded) {
    redirect("/onboarding");
  }

  if (user && onboardingState && !onboardingState.tasteOnboarded) {
    redirect("/onboarding/taste");
  }

  const [starterTracks, canAccessStudio] = await Promise.all([
    getStarterTracks({ viewerId: user?.id, limit: 6 }),
    user ? getStarterCuratorAccess() : Promise.resolve(false),
  ]);

  return (
    <ReactQueryProvider>
      <SidebarProvider
        defaultOpen={true}
        className="bg-[var(--kocteau-canvas)]"
        style={
          {
            "--sidebar-width": "17rem",
            "--sidebar-width-icon": "3.1rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar
          profile={safeProfile}
          ownedReviews={ownedReviews}
          unreadCount={initialUnreadCount}
          canAccessStudio={canAccessStudio}
        />
        <SidebarInset className="min-h-svh bg-[var(--kocteau-canvas)] lg:h-dvh lg:overflow-hidden lg:p-2.5">
          <RouteHeaderProvider>
            <GlobalShortcuts isAuthenticated={Boolean(safeProfile)} />
            <div className="kocteau-app-frame flex min-h-svh flex-1 flex-col lg:min-h-0 lg:h-full lg:overflow-hidden lg:rounded-[0.8rem]">
              <Header profile={safeProfile} />
              <div className="mx-auto flex min-h-0 w-full max-w-[82rem] flex-1 flex-col px-3.5 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:px-6 sm:pt-[calc(env(safe-area-inset-top)+4.75rem)] sm:pb-28 lg:max-w-none lg:overflow-hidden lg:px-0 lg:py-0">
                <div className="mx-auto grid min-h-0 w-full max-w-[76rem] flex-1 gap-5 lg:h-full lg:grid-cols-[minmax(0,44rem)_16rem] lg:items-stretch lg:justify-center lg:px-7 xl:gap-6 xl:px-8">
                  <main className="no-scrollbar min-w-0 lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:pr-1">
                    {children}
                  </main>
                  <WhoToFollowRail
                    isAuthenticated={Boolean(safeProfile)}
                    starterTracks={starterTracks}
                  />
                </div>
              </div>
            </div>
            <MobileBottomBar profile={safeProfile} />
          </RouteHeaderProvider>
        </SidebarInset>
      </SidebarProvider>
    </ReactQueryProvider>
  );
}
