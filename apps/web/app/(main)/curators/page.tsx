import Link from "next/link";
import CuratorApplicationClient from "@/components/curator-application-client";
import { Button } from "@/components/ui/button";
import type { CuratorApplication } from "@/lib/curators";
import { getCurrentUserId } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = createPageMetadata({
  title: "Curate for Kocteau",
  description: "Help surface independent music through a human editorial lens.",
  path: "/curators",
});

export default async function CuratorsPage() {
  const userId = await getCurrentUserId();
  let application: CuratorApplication | null = null;

  if (userId) {
    const supabase = await supabaseServer();
    const result = await supabase
      .from("curator_applications")
      .select("*")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      console.error("[curators.page] application read failed", {
        code: result.error.code ?? null,
        message: result.error.message ?? null,
        userId,
      });
    } else {
      application = result.data;
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-8 pb-10 pt-2 sm:pt-5">
      <header className="max-w-2xl space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/68">
          Kocteau curators
        </p>
        <h1 className="text-balance font-heading text-3xl font-medium tracking-[-0.025em] text-foreground sm:text-4xl">
          Help someone find the record they did not know to look for.
        </h1>
        <p className="max-w-xl text-pretty text-sm leading-6 text-muted-foreground">
          We are inviting listeners with a clear point of view to scout catalog candidates,
          shape quiet editorial routes, and strengthen discovery before the community is large.
        </p>
      </header>

      <div className="grid gap-px overflow-hidden rounded-[var(--kocteau-radius-card)] border border-border/20 bg-border/20 sm:grid-cols-3">
        {[
          ["Find", "Surface overlooked tracks, albums, and artists."],
          ["Frame", "Add a short, factual reason a candidate belongs."],
          ["Route", "Send it into a shared queue before publication."],
        ].map(([title, note]) => (
          <div key={title} className="bg-[var(--kocteau-shell)] px-4 py-4">
            <p className="text-[12px] font-medium text-foreground">{title}</p>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{note}</p>
          </div>
        ))}
      </div>

      {userId ? (
        <CuratorApplicationClient initialApplication={application} />
      ) : (
        <div className="flex flex-col items-start gap-4 rounded-[var(--kocteau-radius-card)] border border-border/22 bg-card/20 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Apply with your Kocteau profile</p>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
              Your reviews and profile provide the context. We will not ask for your email again.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/login?next=%2Fcurators">Log in to apply</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
