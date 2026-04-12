import ReactQueryProvider from "../providers/react-query-provider";
import Header from "@/components/header";
import AppSidebar from "@/components/app-sidebar";
import GlobalShortcuts from "@/components/global-shortcuts";
import MobileBottomBar from "@/components/mobile-bottom-bar";
import { RouteHeaderProvider } from "@/components/route-header-context";
import { getCurrentViewerProfile } from "@/lib/auth/server";
import type { SidebarOwnedReview } from "@/lib/types/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const safeProfile = await getCurrentViewerProfile();
  const initialUnreadCount = 0;
  const ownedReviews: SidebarOwnedReview[] = [];

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
        <SidebarInset className="min-h-svh">
          <RouteHeaderProvider>
            {safeProfile ? <GlobalShortcuts /> : null}
            <Header
              profile={safeProfile}
              initialUnreadCount={initialUnreadCount}
              initialNotifications={[]}
            />
            <main className="mx-auto flex min-h-0 w-full max-w-[82rem] flex-1 flex-col px-3.5 pt-20 pb-32 sm:px-6 sm:pt-24 sm:pb-28 lg:px-7 lg:pt-24 lg:pb-10 xl:px-8">
              {children}
            </main>
            <MobileBottomBar profile={safeProfile} />
          </RouteHeaderProvider>
        </SidebarInset>
      </SidebarProvider>
    </ReactQueryProvider>
  );
}
