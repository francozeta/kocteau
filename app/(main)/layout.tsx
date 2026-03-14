import { supabaseServer } from "@/lib/supabase/server";
import ReactQueryProvider from "../providers/react-query-provider";
import Header from "@/components/header";
import MobileBottomBar from "@/components/mobile-bottom-bar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const safeProfile = user
    ? (
        await supabase
          .from("profiles")
          .select("username, avatar_url, display_name, bio, spotify_url, apple_music_url, deezer_url")
          .eq("id", user.id)
          .maybeSingle()
      ).data ?? {
        username: "user",
        avatar_url: null,
        display_name: null,
        bio: null,
        spotify_url: null,
        apple_music_url: null,
        deezer_url: null,
      }
    : null;

  return (
    <ReactQueryProvider>
      <Header profile={safeProfile} />
      <main className="mx-auto w-full max-w-7xl px-4 pt-8 pb-24 sm:px-6 sm:pt-10 sm:pb-12 lg:px-8 lg:pt-12">
        {children}
      </main>
      <MobileBottomBar profile={safeProfile} />
    </ReactQueryProvider>
  );
}
