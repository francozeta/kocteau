export function scoutDomains(sourceClass: "editorial" | "community") {
  return sourceClass === "community" ? ["reddit.com"] : ["daily.bandcamp.com", "pitchfork.com"];
}

export function scoutSource(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port) return null;
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "reddit.com" && /^\/r\/[^/]+\/comments\/[a-z0-9]+(?:\/|$)/i.test(parsed.pathname)) return { label: "Reddit", evidenceClass: "community" };
    if (host === "daily.bandcamp.com" && /^\/[^/]+\/[^/]+/.test(parsed.pathname)) return { label: "Bandcamp Daily", evidenceClass: "editorial" };
    if (host === "pitchfork.com" && /^\/(reviews|features|thepitch|news)\/[^/]+/.test(parsed.pathname)) return { label: "Pitchfork", evidenceClass: "editorial" };
    return null;
  } catch { return null; }
}
