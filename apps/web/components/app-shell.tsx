import { redirect } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import ReactQueryProvider from "@/app/providers/react-query-provider";
import AppSidebar from "@/components/app-sidebar";
import DesktopScrollBridge from "@/components/desktop-scroll-bridge";
import GlobalShortcuts from "@/components/global-shortcuts";
import Header from "@/components/header";
import MobileBottomBar from "@/components/mobile-bottom-bar";
import { RouteHeaderProvider } from "@/components/route-header-context";
import { SecondaryRailProvider } from "@/components/secondary-rail-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import WhoToFollowRail from "@/components/who-to-follow-rail";
import {
  getCurrentOnboardingState,
  getCurrentUserId,
  getCurrentViewerProfile,
} from "@/lib/auth/server";
import { getStarterCuratorAccess } from "@/lib/queries/curation";
import { cn } from "@/lib/utils";

type AppShellVariant = "feed" | "studio";

type AppShellProps = {
  children: ReactNode;
  variant?: AppShellVariant;
};

export default async function AppShell({
  children,
  variant = "feed",
}: AppShellProps) {
  const [userId, safeProfile, onboardingState] = await Promise.all([
    getCurrentUserId(),
    getCurrentViewerProfile(),
    getCurrentOnboardingState(),
  ]);
  const initialUnreadCount = 0;

  if (userId && onboardingState && !onboardingState.profileOnboarded) {
    redirect("/onboarding");
  }

  if (userId && onboardingState && !onboardingState.tasteOnboarded) {
    redirect("/onboarding/taste");
  }

  const canAccessStudio = userId ? await getStarterCuratorAccess() : false;
  const isStudio = variant === "studio";

  const content = (
    <>
      <GlobalShortcuts isAuthenticated={Boolean(safeProfile)} />
      <div
        data-kocteau-scroll-boundary
        className="kocteau-app-frame flex min-h-svh flex-1 flex-col lg:min-h-0 lg:h-full lg:overflow-hidden lg:rounded-[0.8rem]"
      >
        <Header profile={safeProfile} />
        <DesktopScrollBridge />
        <div className="mx-auto flex min-h-0 w-full max-w-[82rem] flex-1 flex-col px-3.5 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:px-6 sm:pt-[calc(env(safe-area-inset-top)+4.75rem)] sm:pb-28 lg:max-w-none lg:overflow-hidden lg:px-0 lg:py-0">
          {isStudio ? (
            <div className="mx-auto flex min-h-0 w-full max-w-none flex-1 lg:h-full lg:px-7 xl:px-8">
              <main
                data-kocteau-scroll-main
                className="no-scrollbar w-full min-w-0 lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto"
              >
                {children}
              </main>
            </div>
          ) : (
            <div
              className={cn(
                "mx-auto grid min-h-0 w-full max-w-[76rem] flex-1 gap-5 lg:h-full lg:items-stretch lg:justify-center lg:px-7 xl:gap-6 xl:px-8",
                safeProfile
                  ? "lg:grid-cols-[minmax(0,44rem)_16rem]"
                  : "lg:max-w-none lg:grid-cols-[minmax(0,1fr)] lg:px-0 xl:px-0",
              )}
            >
              <main
                data-kocteau-scroll-main
                className={cn(
                  "no-scrollbar min-w-0 lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto",
                  safeProfile && "lg:pr-1",
                )}
              >
                {children}
              </main>
              {safeProfile ? <WhoToFollowRail isAuthenticated /> : null}
            </div>
          )}
        </div>
      </div>
      <MobileBottomBar profile={safeProfile} />
    </>
  );

  return (
    <ReactQueryProvider>
      <SidebarProvider
        defaultOpen={true}
        className="bg-[var(--kocteau-canvas)]"
        style={
          {
            "--sidebar-width": "15.25rem",
            "--sidebar-width-icon": "3.1rem",
          } as CSSProperties
        }
      >
        <AppSidebar
          profile={safeProfile}
          unreadCount={initialUnreadCount}
          canAccessStudio={canAccessStudio}
        />
        <SidebarInset
          className={cn(
            "min-h-svh overflow-x-clip lg:h-dvh lg:overflow-hidden lg:p-2.5",
            safeProfile
              ? "bg-[var(--kocteau-canvas)]"
              : "bg-[var(--kocteau-shell)] lg:bg-[var(--kocteau-canvas)]",
          )}
        >
          <RouteHeaderProvider>
            {isStudio ? content : <SecondaryRailProvider>{content}</SecondaryRailProvider>}
          </RouteHeaderProvider>
        </SidebarInset>
      </SidebarProvider>
    </ReactQueryProvider>
  );
}
