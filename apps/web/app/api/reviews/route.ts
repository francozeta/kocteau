import { revalidatePath, revalidateTag } from "next/cache";
import { after, NextResponse } from "next/server";
import { syncEntityMusicLinksFromDeezer } from "@/lib/music-links";
import { findEntityByProvider } from "@/lib/queries/entities";
import { getViewerReview } from "@/lib/queries/reviews";
import { enforceRateLimit, rateLimits } from "@/lib/rate-limit";
import {
  inferEntityPreferenceTagsFromReview,
  syncEntityPreferenceTagsFromStarterTrack,
} from "@/lib/recommendations/entity-tags";
import { supabaseServer } from "@/lib/supabase/server";
import { createReviewSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

function logReviewCreationError(
  error: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    hint?: string | null;
  },
  context: {
    userId: string;
    providerId: string;
    type: string;
    title: string;
  },
) {
  console.error("[reviews.create] failed", {
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    context,
  });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(
    rateLimits.createReview,
    auth.user.id,
  );

  if (rateLimited) {
    return rateLimited;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = createReviewSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Please review the track and rating before publishing.");
  }

  const review = parsed.data;

  const { data, error } = await supabase.rpc("create_review_with_entity", {
    p_provider: review.provider,
    p_provider_id: review.provider_id,
    p_type: review.type,
    p_title: review.title,
    p_artist_name: review.artist_name,
    p_cover_url: review.cover_url,
    p_deezer_url: review.deezer_url,
    p_review_title: review.review_title,
    p_review_body: review.review_body,
    p_rating: review.rating,
    p_is_pinned: review.is_pinned,
  });

  if (error) {
    logReviewCreationError(error, {
      userId: auth.user.id,
      providerId: review.provider_id,
      type: review.type,
      title: review.title,
    });

    const isDuplicateReview =
      error.code === "23505" ||
      error.message?.toLowerCase().includes("duplicate key") ||
      false;

    if (isDuplicateReview) {
      const existingEntity = await findEntityByProvider(
        review.provider,
        review.type,
        review.provider_id,
      );
      const existingReview =
        existingEntity?.id
          ? await getViewerReview(existingEntity.id, auth.user.id)
          : null;

      return NextResponse.json(
        {
          error:
            "No puedes hacer una reseña de la misma canción dos veces. Puedes editar tu reseña existente.",
          code: "ALREADY_REVIEWED",
          reviewId: existingReview?.id ?? null,
          entityId: existingEntity?.id ?? null,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Ocurrió un error al crear la reseña. Intenta nuevamente.",
        code: error.code === "42501" ? "UNAUTHORIZED" : "CREATE_REVIEW_FAILED",
      },
      { status: error.code === "42501" ? 401 : 500 }
    );
  }

  const result = Array.isArray(data) ? data[0] : data;
  const reviewId = result?.review_id ?? null;
  const entityId = result?.entity_id ?? null;

  await syncEntityPreferenceTagsFromStarterTrack(supabase, {
    entityId,
    provider: review.provider,
    providerId: review.provider_id,
    type: review.type,
    context: "reviews.create",
  });

  await inferEntityPreferenceTagsFromReview(supabase, {
    entityId,
    rating: review.rating,
    context: "reviews.create",
  });

  if (review.provider === "deezer" && review.type === "track" && entityId) {
    after(async () => {
      const syncResult = await syncEntityMusicLinksFromDeezer({
        entityId,
        providerId: review.provider_id,
        context: "reviews.create",
      });

      if (!syncResult.ok || syncResult.linksResolved === 0) {
        return;
      }

      revalidateTag("entities", "max");
      revalidateTag(`entity:${entityId}`, "max");
      revalidateTag(`entity:${entityId}:links`, "max");
      revalidatePath(`/track/${entityId}`);
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", auth.user.id)
    .maybeSingle<{ username: string | null }>();

  revalidateTag("feed", "max");
  revalidateTag("reviews", "max");
  revalidateTag("profiles", "max");
  revalidateTag("entities", "max");
  revalidateTag(`profile:${auth.user.id}:reviews`, "max");

  if (entityId) {
    revalidateTag(`entity:${entityId}`, "max");
    revalidateTag(`entity:${entityId}:reviews`, "max");
    revalidatePath(`/track/${entityId}`);
  }

  if (reviewId) {
    revalidateTag(`review:${reviewId}`, "max");
  }

  if (profile?.username) {
    revalidateTag(`profile:${profile.username}`, "max");
    revalidatePath(`/u/${profile.username}`);
  }

  revalidatePath("/");
  revalidatePath("/track");

  return NextResponse.json({
    ok: true,
    review: result,
    reviewId,
    entityId,
    authorUsername: profile?.username ?? null,
  });
}
