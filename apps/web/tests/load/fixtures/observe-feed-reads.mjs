import { appendFileSync } from "node:fs";

if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").href !== "http://127.0.0.1:54321/") {
  throw new Error("Feed read tracing requires the local Supabase stack");
}
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? String(input) : input.url);
  if (url.origin === "http://127.0.0.1:54321" && url.pathname.startsWith("/rest/v1/")) {
    const event = JSON.stringify({ operation: url.pathname });
    if (process.env.FEED_READ_TRACE_FILE) appendFileSync(process.env.FEED_READ_TRACE_FILE, event + "\n");
    else console.log(event);
  }
  return originalFetch(input, init);
};
