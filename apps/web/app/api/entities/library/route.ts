import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { enforceRateLimit, rateLimits } from "@/lib/rate-limit";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";
import { supabaseServer } from "@/lib/supabase/server";
import { entityLibraryMutationSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

async function resolveEntityId(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  entity: {
    id: string | null;
    provider: "deezer";
    provider_id: string;
    type: "track";
    title: string;
    artist_name: string | null;
    cover_url: string | null;
    deezer_url: string | null;
  },
) {
  if (entity.id) {
    return entity.id;
  }

  const { data, error } = await supabase
    .from("entities")
    .upsert(
      {
        provider: entity.provider,
        provider_id: entity.provider_id,
        type: entity.type,
        title: entity.title,
        artist_name: entity.artist_name,
        cover_url: entity.cover_url,
        deezer_url: entity.deezer_url,
      },
      { onConflict: "provider,type,provider_id" },
    )
    .select("id, provider, provider_id, type, title, artist_name")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "We could not save this track right now.");
  }

  return data.id;
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = entityLibraryMutationSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Invalid library item.");
  }

  const rateLimited = await enforceRateLimit(
    rateLimits.setEntityLibraryItem,
    auth.user.id,
  );

  if (rateLimited) {
    return rateLimited;
  }

  try {
    const entityId = await resolveEntityId(supabase, parsed.data.entity);
    const { data, error } = await supabase.rpc("set_entity_library_item", {
      p_active: parsed.data.active,
      p_entity_id: entityId,
      p_item_type: parsed.data.itemType,
      p_source: parsed.data.source,
    });

    if (error) {
      const status = error.code === "42501" ? 401 : 400;

      return NextResponse.json(
        { error: error.message, code: error.code ?? null },
        { status },
      );
    }

    const result = Array.isArray(data) ? data[0] : data;

    revalidatePath("/library");

    if (parsed.data.entity.id) {
      revalidatePath(
        buildEntityCanonicalPath({
          id: parsed.data.entity.id,
          provider: parsed.data.entity.provider,
          provider_id: parsed.data.entity.provider_id,
          type: parsed.data.entity.type,
          title: parsed.data.entity.title,
          artist_name: parsed.data.entity.artist_name,
        }),
      );
    }

    return NextResponse.json({
      ok: true,
      entityId,
      itemType: result?.item_type ?? parsed.data.itemType,
      active: result?.active ?? parsed.data.active,
      savedAt: result?.created_at ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "We could not update your library right now.",
      },
      { status: 400 },
    );
  }
}
