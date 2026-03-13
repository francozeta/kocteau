import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import ReactQueryProvider from "../providers/react-query-provider";
import Header from "@/components/header";
import MobileBottomBar from "@/components/mobile-bottom-bar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, avatar_url, display_name")
    .eq("id", data.user.id)
    .single();

  // Ultra-safe fallback: if for some reason a profile doesn't exist (rare), it prevents crashes.
  const safeProfile = profile ?? {
    username: "user",
    avatar_url: null,
    display_name: null,
  };

  return (
    <ReactQueryProvider>
      <Header profile={safeProfile} />
      <main className="mx-auto w-full max-w-7xl px-4 pt-8 pb-24 sm:px-6 sm:pt-10 sm:pb-12 lg:px-8 lg:pt-12">
        {children}
      </main>
      <MobileBottomBar username={safeProfile.username} />
    </ReactQueryProvider>
  );
}
