import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type EntityType = Database["public"]["Enums"]["entity_type"];

type CreateReviewPayload = {
  provider: string;
  provider_id: string;
  type: EntityType;
  title: string;
  artist_name?: string | null;
  cover_url?: string | null;
  deezer_url?: string | null;
  review_title?: string | null;
  review_body?: string | null;
  rating: number;
  is_pinned?: boolean;
};

function isValidPayload(payload: unknown): payload is CreateReviewPayload {
  if (!payload || typeof payload !== "object") return false;

  const candidate = payload as Record<string, unknown>;

  return (
    typeof candidate.provider === "string" &&
    typeof candidate.provider_id === "string" &&
    (candidate.type === "track" || candidate.type === "album") &&
    typeof candidate.title === "string" &&
    typeof candidate.rating === "number"
  );
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = (await req.json()) as unknown;

  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("create_review_with_entity", {
    p_provider: payload.provider,
    p_provider_id: payload.provider_id,
    p_type: payload.type,
    p_title: payload.title,
    p_artist_name: payload.artist_name ?? null,
    p_cover_url: payload.cover_url ?? null,
    p_deezer_url: payload.deezer_url ?? null,
    p_review_title: payload.review_title ?? null,
    p_review_body: payload.review_body ?? null,
    p_rating: payload.rating,
    p_is_pinned: payload.is_pinned ?? false,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code ?? null },
      { status: error.code === "42501" ? 401 : 400 }
    );
  }

  const result = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({ ok: true, review: result });
}
