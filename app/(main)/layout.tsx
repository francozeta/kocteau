import { supabaseServer } from "@/lib/supabase/server";
import ReactQueryProvider from "../providers/react-query-provider";
import Header from "@/components/header";
import AppSidebar from "@/components/app-sidebar";
import {
  getNotificationsForUser,
  getUnreadNotificationsCount,
} from "@/lib/queries/notifications";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [safeProfile, initialUnreadCount, initialNotifications] = user
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
      ])
    : [null, 0, []];

  return (
    <ReactQueryProvider>
      <SidebarProvider defaultOpen>
        <AppSidebar profile={safeProfile} />
        <SidebarInset className="min-h-svh bg-background">
          <Header
            profile={safeProfile}
            initialUnreadCount={initialUnreadCount}
            initialNotifications={initialNotifications}
          />
          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ReactQueryProvider>
  );
}
