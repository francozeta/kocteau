import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) return NextResponse.json([], { status: 200 });

  const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=10`;
  const res = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Deezer request failed" }, { status: 502 });
  }

  const json = await res.json();

  const results =
    (json?.data ?? []).map((item: any) => ({
      provider: "deezer" as const,
      provider_id: String(item.id),
      type: "track" as const, // Deezer search here returns tracks
      title: item.title as string,
      artist_name: item.artist?.name ?? null,
      cover_url: item.album?.cover_medium ?? item.album?.cover ?? null,
      deezer_url: item.link ?? null,
    })) ?? [];

  return NextResponse.json(results);
}