import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  starterTrackArchiveSchema,
  starterTrackUpsertSchema,
} from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

async function requireStarterCurator() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  const { data: hasAccess, error } = await supabase.rpc("is_starter_curator");

  if (error) {
    console.error("[starter.tracks.requireStarterCurator] failed", {
      code: error.code ?? null,
      message: error.message ?? null,
    });

    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Starter curator roles are not configured." },
        { status: 500 },
      ),
    };
  }

  if (!hasAccess) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Not allowed" }, { status: 403 }),
    };
  }

  return { ok: true as const, supabase };
}

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

export async function GET() {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const { data, error } = await curator.supabase
    .from("starter_tracks")
    .select(
      "id, provider, provider_id, type, title, artist_name, cover_url, deezer_url, prompt, editorial_note, is_active, is_featured, sort_order, created_at, updated_at",
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "We could not load starter tracks." },
      { status: 500 },
    );
  }

  return NextResponse.json(data ?? []);
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
    p_artist_name: starter.artist_name,
    p_cover_url: starter.cover_url,
    p_deezer_url: starter.deezer_url,
    p_prompt: starter.prompt,
    p_editorial_note: starter.editorial_note,
    p_is_featured: starter.is_featured,
    p_is_active: starter.is_active,
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
