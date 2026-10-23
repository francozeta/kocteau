const fixtureOrigin = "https://example.supabase.co";
if (
  process.env.NEXT_PUBLIC_SUPABASE_URL !== fixtureOrigin ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== "ci-placeholder"
) {
  throw new Error("The build fixture requires the CI placeholder Data API configuration");
}

const nativeFetch = globalThis.fetch;
const publicTables = new Set(["/rest/v1/reviews", "/rest/v1/starter_tracks"]);
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.origin === fixtureOrigin && publicTables.has(url.pathname)) {
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    if (method !== "GET") throw new Error("The build fixture supports public reads only");
    return new Response("[]", { headers: { "Content-Type": "application/json" } });
  }
  if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
    return nativeFetch(input, init);
  }
  throw new Error("The isolated build blocked an unexpected network request");
};
