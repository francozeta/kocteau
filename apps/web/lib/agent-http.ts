/**
 * Public content-negotiation helpers. Browser pages retain the Next.js renderer.
 * Do not use these helpers for authenticated application/API requests.
 */
export type PageRepresentation = "html" | "markdown" | "not-acceptable";

type AcceptEntry = { type: string; quality: number; position: number; specificity: number };

function parseAccept(header: string): AcceptEntry[] {
  return header.split(",").flatMap((part, position) => {
    const [rawType, ...params] = part.trim().split(";");
    const type = rawType?.trim().toLowerCase() ?? "";
    if (!/^(?:\*\/\*|[a-z0-9!#$&^_.+-]+\/(?:\*|[a-z0-9!#$&^_.+-]+))$/.test(type)) return [];
    let quality = 1;
    for (const param of params) {
      const match = param.trim().match(/^q\s*=\s*(\d*(?:\.\d+)?)$/i);
      if (match) {
        const value = Number(match[1]);
        quality = Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0;
      }
    }
    return [{
      type, quality, position,
      specificity: type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2,
    }];
  });
}

function bestAcceptEntry(entries: AcceptEntry[], target: string): AcceptEntry | null {
  let best: AcceptEntry | null = null;
  for (const entry of entries) {
    const matches = entry.type === target ||
      entry.type === "*/*" ||
      (entry.type.endsWith("/*") && target.startsWith(entry.type.slice(0, -1)));
    if (!matches) continue;
    if (!best || entry.specificity > best.specificity ||
      (entry.specificity === best.specificity && entry.position < best.position)) {
      best = entry;
    }
  }
  return best;
}

export function preferredPageRepresentation(accept: string | null): PageRepresentation {
  if (!accept?.trim()) return "html";
  const entries = parseAccept(accept);
  if (!entries.length) return "html";
  const html = bestAcceptEntry(entries, "text/html");
  const markdown = bestAcceptEntry(entries, "text/markdown");
  const htmlQ = html?.quality ?? 0;
  const markdownQ = markdown?.quality ?? 0;
  if (htmlQ <= 0 && markdownQ <= 0) return "not-acceptable";
  return markdownQ > htmlQ || (markdownQ === htmlQ && (markdown?.position ?? Infinity) < (html?.position ?? Infinity))
    ? "markdown"
    : "html";
}

// This guard is only for unknown *top-level* document routes. Known roots are
// left to Next.js, preserving all dynamic URLs, authenticated pages and 404 UX.
const knownPageRoots = new Set([
  "album", "albums", "artist", "artists", "auth", "curators", "docs",
  "feed", "help", "library", "login", "notifications", "onboarding",
  "review", "reviews", "saved", "search", "settings", "signup", "studio",
  "track", "tracks", "u", "openapi.json", "manifest.webmanifest",
]);

export function isUnknownTopLevelPage(pathname: string) {
  if (pathname === "/" || !pathname.startsWith("/")) return false;
  const firstSegment = pathname.slice(1).split("/")[0] ?? "";
  return Boolean(firstSegment && !firstSegment.startsWith(".") && !knownPageRoots.has(firstSegment));
}

export const homepageMarkdown = [
  "# Kocteau — music reviews and discovery",
  "",
  "Kocteau is a music review and discovery app built around real listeners, their ratings, and their listening notes. It helps people find tracks, albums, artists, and the perspectives of others who have spent time with the music.",
  "",
  "## What you can do",
  "",
  "- Read public reviews and ratings written by listeners, with context about the music being discussed.",
  "- Discover tracks through other listeners, public music pages, and curated starting points.",
  "- Keep your own track ratings and listening notes after signing in with an email one-time code.",
  "- Save reviews, follow listeners, and shape your own taste-based feed after signing in.",
  "",
  "## Public entry points",
  "",
  "- [Recent public reviews](https://kocteau.com/reviews)",
  "- [Browse and search music](https://kocteau.com/search)",
  "- [Kocteau documentation](https://kocteau.com/docs)",
  "- [Kocteau API documentation](https://kocteau.com/docs/api)",
  "- [OpenAPI specification](https://kocteau.com/openapi.json)",
  "- [Machine-readable site index](https://kocteau.com/llms.txt)",
  "- [Sitemap](https://kocteau.com/sitemap.xml)",
  "",
  "## For agents",
  "",
  "Cite a review at its canonical /reviews/{reviewId}/{entitySlug} URL. Use /api/search?q=... only to look up public music catalog candidates; do not treat API output as a listener review. Publication and personal actions require user authentication and are not exposed as public agent tools.",
  "",
].join("\n");

export function markdownNotFoundBody() {
  return [
    "# 404 — Page not found",
    "",
    "The requested Kocteau page does not exist. Check the URL, browse the [documentation](https://kocteau.com/docs), or start from the [site index](https://kocteau.com/llms.txt).",
    "",
  ].join("\n");
}

export function markdownPageResponse(body: string, status = 200, method = "GET") {
  return new Response(method === "HEAD" ? null : body, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept",
      "Cache-Control": status === 404 ? "public, max-age=60, s-maxage=300" : "public, max-age=300, s-maxage=300",
      ...(status === 404 ? { "X-Robots-Tag": "noindex, nofollow, noarchive" } : {}),
    },
  });
}
