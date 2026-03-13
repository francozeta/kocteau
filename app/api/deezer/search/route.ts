import { NextResponse } from "next/server";
import { searchDeezerTracks } from "@/lib/deezer";
import { supabaseServer } from "@/lib/supabase/server";

type ExistingEntity = {
  id: string;
  provider_id: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) return NextResponse.json([], { status: 200 });

  try {
    const results = await searchDeezerTracks(q, 12);
    const providerIds = results.map((result) => result.provider_id);

    if (providerIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const supabase = await supabaseServer();
    const { data: entities } = await supabase
      .from("entities")
      .select("id, provider_id")
      .eq("provider", "deezer")
      .eq("type", "track")
      .in("provider_id", providerIds);

    const entityByProviderId = new Map(
      ((entities ?? []) as ExistingEntity[]).map((entity) => [entity.provider_id, entity.id])
    );

    return NextResponse.json(
      results.map((result) => ({
        ...result,
        entity_id: entityByProviderId.get(result.provider_id) ?? null,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Deezer request failed" }, { status: 502 });
  }
}
