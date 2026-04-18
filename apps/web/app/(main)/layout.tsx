import { redirect } from "next/navigation";
import ReactQueryProvider from "../providers/react-query-provider";
import Header from "@/components/header";
import AppSidebar from "@/components/app-sidebar";
import GlobalShortcuts from "@/components/global-shortcuts";
import MobileBottomBar from "@/components/mobile-bottom-bar";
import { RouteHeaderProvider } from "@/components/route-header-context";
import { getCurrentUser, getCurrentViewerProfile } from "@/lib/auth/server";
import type { SidebarOwnedReview } from "@/lib/types/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const [user, safeProfile] = await Promise.all([
    getCurrentUser(),
    getCurrentViewerProfile(),
  ]);
  const initialUnreadCount = 0;
  const ownedReviews: SidebarOwnedReview[] = [];

  if (user && !safeProfile) {
    redirect("/onboarding");
  }

  return (
    <ReactQueryProvider>
      <SidebarProvider
        defaultOpen={true}
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
        />
        <SidebarInset className="min-h-svh bg-background lg:h-dvh lg:overflow-hidden lg:p-2.5">
          <RouteHeaderProvider>
            {safeProfile ? <GlobalShortcuts /> : null}
            <div className="flex min-h-svh flex-1 flex-col lg:min-h-0 lg:h-full lg:overflow-hidden lg:rounded-lg lg:bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.01))] lg:ring-1 lg:ring-white/[0.05]">
              <Header
                profile={safeProfile}
                initialUnreadCount={initialUnreadCount}
                initialNotifications={[]}
              />
              <main className="mx-auto flex min-h-0 w-full max-w-[82rem] flex-1 flex-col px-3.5 pt-20 pb-32 sm:px-6 sm:pt-24 sm:pb-28 lg:max-w-none lg:overflow-y-auto lg:px-7 lg:pt-3 lg:pb-6 xl:px-8">
                {children}
              </main>
            </div>
            <MobileBottomBar profile={safeProfile} />
          </RouteHeaderProvider>
        </SidebarInset>
      </SidebarProvider>
    </ReactQueryProvider>
  );
}
