import ReactQueryProvider from "../providers/react-query-provider";
import Header from "@/components/header";
import AppSidebar from "@/components/app-sidebar";
import GlobalShortcuts from "@/components/global-shortcuts";
import MobileBottomBar from "@/components/mobile-bottom-bar";
import { getCurrentUser, getCurrentViewerProfile } from "@/lib/auth/server";
import {
  getUnreadNotificationsCount,
} from "@/lib/queries/notifications";
import { getRecentlyActiveProfiles } from "@/lib/queries/profiles";
import { supabaseServer } from "@/lib/supabase/server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const [user, safeProfile, activeUsers] = await Promise.all([
    getCurrentUser(),
    getCurrentViewerProfile(),
    getRecentlyActiveProfiles(5),
  ]);

  const initialUnreadCount = user
    ? await (async () => {
        const supabase = await supabaseServer();

        return getUnreadNotificationsCount(supabase, user.id);
      })()
    : 0;

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
          activeUsers={activeUsers}
          unreadCount={initialUnreadCount}
        />
        <SidebarInset className="min-h-svh">
          <GlobalShortcuts />
          <Header
            profile={safeProfile}
            initialUnreadCount={initialUnreadCount}
            initialNotifications={[]}
          />
          <main className="mx-auto w-full max-w-5xl px-3.5 pt-20 pb-32 sm:px-6 sm:pt-24 sm:pb-28 lg:px-10 lg:pt-24 lg:pb-10">
            {children}
          </main>
          <MobileBottomBar profile={safeProfile} />
        </SidebarInset>
      </SidebarProvider>
    </ReactQueryProvider>
  );
}
