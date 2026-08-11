import { notFound, redirect } from "next/navigation";
import CuratorApplicationsStudioClient, {
  type StudioCuratorApplication,
} from "@/components/curator-applications-studio-client";
import { getCurrentUser } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { getKocteauAdminAccess } from "@/lib/queries/curation";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = createPageMetadata({
  title: "Curator Applications",
  description: "Review applications for Kocteau editorial access.",
  path: "/studio/curators",
  noIndex: true,
});

export default async function CuratorApplicationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=%2Fstudio%2Fcurators");
  }

  if (!(await getKocteauAdminAccess())) {
    notFound();
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("curator_applications")
    .select(`
      *,
      applicant:profiles!curator_applications_user_id_fkey (
        avatar_url,
        display_name,
        username
      )
    `)
    .order("submitted_at", { ascending: false })
    .limit(50)
    .returns<StudioCuratorApplication[]>();

  if (error) {
    console.error("[studio.curators] application read failed", {
      code: error.code ?? null,
      message: error.message ?? null,
    });
  }

  return (
    <section className="w-full max-w-5xl space-y-6 pb-8">
      <header className="space-y-1">
        <p className="text-[12px] font-medium text-muted-foreground/72">Studio</p>
        <h1 className="font-heading text-2xl font-medium text-foreground">
          Curator applications
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Grant catalog scouting access without turning applications into public content.
        </p>
      </header>

      {error ? (
        <div className="rounded-[var(--kocteau-radius-card)] border border-destructive/24 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          Applications could not be loaded.
        </div>
      ) : (
        <CuratorApplicationsStudioClient initialApplications={data ?? []} />
      )}
    </section>
  );
}
