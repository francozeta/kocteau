const starterSurfaces = [
  "home",
  "track",
  "profile",
  "review",
  "search",
  "saved",
  "studio",
  "notifications",
  "activity",
  "app",
] as const;

const starterSurfaceSet = new Set<string>(starterSurfaces);

export type StarterSurface = (typeof starterSurfaces)[number];

export function isStarterSurface(value: unknown): value is StarterSurface {
  return typeof value === "string" && starterSurfaceSet.has(value);
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeSegment(value: string | null | undefined) {
  const normalized = safeDecode(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return normalized || null;
}

function getRouteSegments(pathname: string | null | undefined) {
  const rawPathname = typeof pathname === "string" ? pathname : "";
  const [pathWithoutHash] = rawPathname.split("#");
  const [pathOnly] = (pathWithoutHash ?? "").split("?");

  return pathOnly
    .split("/")
    .map(normalizeSegment)
    .filter((segment): segment is string => Boolean(segment));
}

export function getStarterSurfaceFromPathname(
  pathname: string | null | undefined,
): StarterSurface {
  if (typeof pathname !== "string") {
    return "app";
  }

  const [section] = getRouteSegments(pathname);

  if (!section) {
    return "home";
  }

  if (section === "u") {
    return "profile";
  }

  if (section === "review" || section === "reviews") {
    return "review";
  }

  if (section === "tracks") {
    return "track";
  }

  if (isStarterSurface(section)) {
    return section;
  }

  return "app";
}

export function getStarterContextKey(pathname: string | null | undefined) {
  if (typeof pathname !== "string") {
    return "app";
  }

  const segments = getRouteSegments(pathname);
  const [section, detail] = segments;

  if (!section) {
    return "home";
  }

  if (section === "u") {
    return detail ? `profile:${detail}` : "profile";
  }

  if (section === "track") {
    return detail ? `track:${detail}` : "track";
  }

  if (section === "tracks") {
    const stableTrackKey = segments.length === 3 ? segments[2] : segments[2] ?? detail;

    return stableTrackKey ? `track:${stableTrackKey}` : "track";
  }

  if (section === "review" || section === "reviews") {
    return detail ? `review:${detail}` : "review";
  }

  if (section === "studio") {
    return detail ? `studio:${detail}` : "studio";
  }

  const surface = getStarterSurfaceFromPathname(pathname);

  return surface === "app" ? "app" : surface;
}

export function getStarterRailQueryPath(pathname: string | null | undefined) {
  const params = new URLSearchParams({
    surface: getStarterSurfaceFromPathname(pathname),
    context: getStarterContextKey(pathname),
  });

  return `/api/starter/rail?${params.toString()}`;
}
