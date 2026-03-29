import { supabaseServer } from "@/lib/supabase/server";
import ReactQueryProvider from "../providers/react-query-provider";
import Header from "@/components/header";
import AppSidebar from "@/components/app-sidebar";
import MobileBottomBar from "@/components/mobile-bottom-bar";
import {
  getNotificationsForUser,
  getUnreadNotificationsCount,
} from "@/lib/queries/notifications";
import { getRecentlyDiscussedTracks } from "@/lib/queries/discovery";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [safeProfile, initialUnreadCount, initialNotifications, recentTracks] = user
    ? await Promise.all([
        (
          await supabase
            .from("profiles")
            .select("id, username, avatar_url, display_name, bio, spotify_url, apple_music_url, deezer_url")
            .eq("id", user.id)
            .maybeSingle()
        ).data ?? {
          id: user.id,
          username: "user",
          avatar_url: null,
          display_name: null,
          bio: null,
          spotify_url: null,
          apple_music_url: null,
          deezer_url: null,
        },
        getUnreadNotificationsCount(supabase, user.id),
        getNotificationsForUser(supabase, user.id, 8),
        getRecentlyDiscussedTracks(4),
      ])
    : [null, 0, [], await getRecentlyDiscussedTracks(4)];

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
          recentTracks={recentTracks}
          unreadCount={initialUnreadCount}
        />
        <SidebarInset className="min-h-svh">
          <Header
            profile={safeProfile}
            initialUnreadCount={initialUnreadCount}
            initialNotifications={initialNotifications}
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
