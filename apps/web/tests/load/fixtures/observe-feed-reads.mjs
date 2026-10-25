import { appendFileSync, existsSync, readFileSync } from "node:fs";

if (
  new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").href !==
  "http://127.0.0.1:54321/"
) {
  throw new Error("Feed read tracing requires the local Supabase stack");
}
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(
    typeof input === "string" || input instanceof URL
      ? String(input)
      : input.url,
  );
  if (
    url.origin === "http://127.0.0.1:54321" &&
    url.pathname.startsWith("/rest/v1/")
  ) {
    const event = JSON.stringify({ operation: url.pathname });
    if (process.env.FEED_READ_TRACE_FILE)
      appendFileSync(process.env.FEED_READ_TRACE_FILE, event + "\n");
    else console.log(event);
    const faultPath = process.env.FEED_READ_FAULT_FILE;
    const mode =
      faultPath && existsSync(faultPath)
        ? JSON.parse(readFileSync(faultPath, "utf8")).mode
        : null;
    const isBundle =
      url.pathname === "/rest/v1/rpc/get_recommended_feed_bundle";
    const unavailable = mode === "unavailable" && isBundle;
    const denied = mode === "denied" && isBundle;
    const missing =
      (mode === "missing" || mode === "fallback-unavailable") && isBundle;
    const fallbackFailed =
      mode === "fallback-unavailable" && url.pathname === "/rest/v1/reviews";
    if (unavailable || denied || missing || fallbackFailed) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: missing ? "PGRST202" : denied ? "42501" : "57014",
            message: missing
              ? "Missing public.get_recommended_feed_bundle"
              : "Isolated fixture failure",
          }),
          {
            status: missing ? 404 : denied ? 403 : 503,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    }
  }
  return originalFetch(input, init);
};
