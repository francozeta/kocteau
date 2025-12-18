import { type NextRequest, NextResponse } from "next/server"
import { searchTracks, searchAlbums, searchArtists } from "@/lib/deezer"

export const runtime = "edge"

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function cleanQuery(q: string) {
  return q.trim().replace(/\s+/g, " ")
}

// Rate limit ultra simple en memoria
const hits = new Map<string, { count: number; resetAt: number }>()
function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now()
  const cur = hits.get(key)
  if (!cur || now > cur.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs }
  }
  if (cur.count >= limit) return { ok: false, remaining: 0, resetAt: cur.resetAt }
  cur.count += 1
  return { ok: true, remaining: limit - cur.count, resetAt: cur.resetAt }
}

function dedupeById(items: any[]) {
  const seen = new Set<string | number>()
  return items.filter((item: any) => {
    const id = item?.id
    if (id == null || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams

  const qRaw = sp.get("q") ?? ""
  const q = cleanQuery(qRaw)
  const type = sp.get("type") ?? "all" // all, track, album, artist

  // early returns para no gastar llamadas
  if (!q) {
    return NextResponse.json(
      { data: { tracks: [], albums: [], artists: [] }, meta: { query: q, type, limit: 0, tookMs: 0 } },
      { status: 200 },
    )
  }

  const limit = clampInt(Number.parseInt(sp.get("limit") ?? "8", 10) || 8, 1, 25)

  // rate limit por IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown"

  const rl = rateLimit(ip, 40, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded", meta: { resetAt: rl.resetAt } },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    )
  }

  const t0 = Date.now()

  try {
    let tracks: any[] = []
    let albums: any[] = []
    let artists: any[] = []

    if (type === "all" || type === "track") {
      tracks = await searchTracks(q, limit)
    }
    if (type === "all" || type === "album") {
      albums = await searchAlbums(q, type === "all" ? Math.floor(limit / 3) : limit)
    }
    if (type === "all" || type === "artist") {
      artists = await searchArtists(q, type === "all" ? Math.floor(limit / 3) : limit)
    }

    const tookMs = Date.now() - t0

    return NextResponse.json(
      {
        data: {
          tracks: dedupeById(tracks),
          albums: dedupeById(albums),
          artists: dedupeById(artists),
        },
        meta: {
          query: q,
          type,
          limit,
          count: {
            tracks: tracks.length,
            albums: albums.length,
            artists: artists.length,
          },
          tookMs,
          rateLimit: { remaining: rl.remaining, resetAt: rl.resetAt },
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
        },
      },
    )
  } catch (err) {
    const tookMs = Date.now() - t0
    return NextResponse.json({ error: "Deezer search failed", meta: { query: q, tookMs } }, { status: 502 })
  }
}
