import { notFound, redirect } from "next/navigation";
import StarterStudioClient from "@/components/starter-studio-client";
import { getCurrentUser } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { getStarterCuratorAccess } from "@/lib/queries/curation";

export const metadata = createPageMetadata({
  title: "Starter Studio",
  description: "Internal Kocteau starter picks curation.",
  path: "/studio/starter",
  noIndex: true,
});

export default async function StarterStudioPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const hasAccess = await getStarterCuratorAccess();

  if (!hasAccess) {
    notFound();
  }

  return <StarterStudioClient />;
}
