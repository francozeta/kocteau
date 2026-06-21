import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireStarterCurator } from "@/lib/curation/access";
import {
  starterTrackListQuerySchema,
  starterTrackArchiveSchema,
  starterTrackUpsertSchema,
} from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

function starterMutationErrorResponse(error: {
  code?: string | null;
  message?: string | null;
}) {
  if (error.code === "42501") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  return NextResponse.json(
    {
      error:
        error.message ?? "We could not save that starter track right now.",
    },
    { status: 500 },
  );
}

export async function GET(req: Request) {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const url = new URL(req.url);
  const parsedQuery = starterTrackListQuerySchema.safeParse(
    Object.fromEntries(url.searchParams),
  );

  if (!parsedQuery.success) {
    return validationErrorResponse(parsedQuery.error, "Starter track query is invalid.");
  }

  const { limit, offset } = parsedQuery.data;

  const [tracksResult, tagsResult] = await Promise.all([
    curator.supabase
      .from("starter_tracks")
      .select(
        `
          id,
          provider,
          provider_id,
          type,
          title,
          artist_name,
          cover_url,
          deezer_url,
          prompt,
          editorial_note,
          is_active,
          is_featured,
          sort_order,
          created_at,
          updated_at,
          starter_track_tags (
            tag_id,
            weight,
            preference_tags (
              id,
              kind,
              slug,
              label,
              description,
              is_featured,
              sort_order,
              created_at
            )
          )
        `,
        { count: "exact" },
      )
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
    curator.supabase
      .from("preference_tags")
      .select("id, kind, slug, label, description, is_featured, sort_order, created_at")
      .order("sort_order", { ascending: true })
      .order("kind", { ascending: true })
      .order("label", { ascending: true }),
  ]);

  if (tracksResult.error || tagsResult.error) {
    return NextResponse.json(
      { error: "We could not load starter studio data." },
      { status: 500 },
    );
  }

  const tracks = tracksResult.data ?? [];
  const total = tracksResult.count ?? offset + tracks.length;
  const nextOffset = offset + tracks.length < total ? offset + tracks.length : null;

  return NextResponse.json({
    tracks,
    tags: tagsResult.data ?? [],
    total,
    limit,
    offset,
    nextOffset,
    hasMore: nextOffset !== null,
  });
}

export async function POST(req: Request) {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = starterTrackUpsertSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Starter track is invalid.");
  }

  const starter = parsed.data;
  const { data, error } = await curator.supabase.rpc("upsert_starter_track", {
    p_provider: starter.provider,
    p_provider_id: starter.provider_id,
    p_type: starter.type,
    p_title: starter.title,
    p_artist_name: starter.artist_name ?? undefined,
    p_cover_url: starter.cover_url ?? undefined,
    p_deezer_url: starter.deezer_url ?? undefined,
    p_prompt: starter.prompt ?? undefined,
    p_editorial_note: starter.editorial_note ?? undefined,
    p_is_featured: starter.is_featured,
    p_is_active: starter.is_active,
    p_tag_ids: starter.tag_ids,
    p_collection_slug: starter.collection_slug,
  });

  if (error) {
    return starterMutationErrorResponse(error);
  }

  revalidatePath("/");
  revalidatePath("/studio/starter");

  return NextResponse.json({ ok: true, track: data });
}

export async function DELETE(req: Request) {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = starterTrackArchiveSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Starter track is invalid.");
  }

  const { data, error } = await curator.supabase.rpc("archive_starter_track", {
    p_starter_track_id: parsed.data.id,
  });

  if (error) {
    return starterMutationErrorResponse(error);
  }

  revalidatePath("/");
  revalidatePath("/studio/starter");

  return NextResponse.json({ ok: true, track: data });
}
