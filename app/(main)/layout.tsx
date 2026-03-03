import ReactQueryProvider from "../providers/react-query-provider";
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}