import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import NewReviewForm from "@/components/new-review-form";
import { buttonVariants } from "@/components/ui/button";
import { createPageMetadata } from "@/lib/metadata";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type EditableReviewRecord = {
  id: string;
  author_id: string;
  title: string | null;
  body: string | null;
  rating: number;
  is_pinned: boolean;
  entities:
    | {
        id: string;
        provider: "deezer";
        provider_id: string;
        type: "track";
        title: string;
        artist_name: string | null;
        cover_url: string | null;
        deezer_url: string | null;
      }
    | Array<{
        id: string;
        provider: "deezer";
        provider_id: string;
        type: "track";
        title: string;
        artist_name: string | null;
        cover_url: string | null;
        deezer_url: string | null;
      }>
    | null;
};

export const metadata: Metadata = createPageMetadata({
  title: "Edit review",
  description: "Edit your review on Kocteau.",
  path: "/review/[id]/edit",
  noIndex: true,
});

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .select(
      `
        id,
        author_id,
        title,
        body,
        rating,
        is_pinned,
        entities (
          id,
          provider,
          provider_id,
          type,
          title,
          artist_name,
          cover_url,
          deezer_url
        )
      `,
    )
    .eq("id", id)
    .maybeSingle<EditableReviewRecord>();

  if (error || !review) {
    notFound();
  }

  if (review.author_id !== user.id) {
    redirect(`/review/${id}`);
  }

  const entity = Array.isArray(review.entities)
    ? review.entities[0] ?? null
    : review.entities;

  if (!entity) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 sm:space-y-7">
      <div className="border-b border-border/30 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Review
            </p>
            <h1 className="text-[1.95rem] font-semibold tracking-tight sm:text-[2.2rem]">
              Edit review
            </h1>
          </div>

          <Link
            href={`/review/${id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2 rounded-full border-border/30")}
          >
            <ArrowLeft className="size-4" />
            Back to review
          </Link>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-border/20 bg-card/16 p-3 sm:p-4">
        <div className="min-h-[34rem]">
          <NewReviewForm
            mode="edit"
            reviewId={review.id}
            initialSelection={{
              provider: entity.provider,
              provider_id: entity.provider_id,
              type: entity.type,
              title: entity.title,
              artist_name: entity.artist_name,
              cover_url: entity.cover_url,
              deezer_url: entity.deezer_url,
              entity_id: entity.id,
            }}
            initialTitle={review.title ?? ""}
            initialBody={review.body ?? ""}
            initialRating={review.rating}
            initialPinned={review.is_pinned}
            redirectToOnSuccess={`/review/${review.id}`}
          />
        </div>
      </div>
    </section>
  );
}
