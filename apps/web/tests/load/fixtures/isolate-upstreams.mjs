const configured = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321");
if (configured.href !== "http://127.0.0.1:54321/") {
  throw new Error("Isolated verification requires the IPv4 loopback Data API fixture");
}

const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? String(input) : input.url);
  if (url.hostname === "api.deezer.com") {
    return nativeFetch("http://127.0.0.1:54321/provider" + url.pathname + url.search, init);
  }
  if (["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) return nativeFetch(input, init);
  return Promise.reject(new TypeError("Isolated verification blocked outbound fetch"));
};
