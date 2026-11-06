/**
 * Kocteau — Cloudflare runtime-only probe.
 * This is NOT the music app; it has no auth, database, API or graphics.
 */
const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow, noarchive",
  "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
};

export default {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (request.method === "GET" && path === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          purpose: "cloudflare-infrastructure-only",
          appDeployed: false,
          supabaseConnected: false,
          loginEnabled: false,
        }),
        { status: 200, headers },
      );
    }
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers });
  },
};
