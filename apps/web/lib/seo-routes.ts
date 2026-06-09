export type SeoEntityType = "track" | "album" | "artist";

export type SeoEntityRouteInput = {
  id?: string | null;
  provider?: string | null;
  provider_id?: string | null;
  type?: string | null;
  title: string;
  artist_name?: string | null;
};

export type SeoReviewRouteInput = {
  id: string;
  entities?: SeoEntityRouteInput | null;
};

const fallbackSlug = "music";
const shortRouteIdLength = 12;
const fullUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const shortUuidPrefixPattern = /^(?:[0-9a-f]{8}|[0-9a-f]{12})$/i;

const entityRouteRoots: Record<Extract<SeoEntityType, "track">, string> = {
  track: "tracks",
};

export function isSeoEntityType(value: string | null | undefined): value is SeoEntityType {
  return value === "track" || value === "album" || value === "artist";
}

export function getEntityRouteRoot(type: string | null | undefined) {
  return type === "track" || !type ? entityRouteRoots.track : null;
}

export function slugifyForUrl(value: string | null | undefined) {
  const slug = (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || fallbackSlug;
}

export function getEntitySlug(entity: SeoEntityRouteInput | null | undefined) {
  if (!entity) {
    return fallbackSlug;
  }

  const label =
    entity.type === "artist"
      ? entity.title
      : [entity.title, entity.artist_name].filter(Boolean).join(" ");

  return slugifyForUrl(label);
}

export function getShortRouteId(id: string) {
  return id.replaceAll("-", "").slice(0, shortRouteIdLength).toLowerCase();
}

export function isFullUuid(value: string | null | undefined) {
  return Boolean(value && fullUuidPattern.test(value));
}

export function isShortUuidPrefix(value: string | null | undefined) {
  return Boolean(value && shortUuidPrefixPattern.test(value));
}

export function isSeoRouteId(value: string | null | undefined) {
  return isFullUuid(value) || isShortUuidPrefix(value);
}

export function buildEntityCanonicalPath(entity: SeoEntityRouteInput) {
  const routeRoot = getEntityRouteRoot(entity.type);
  const slug = getEntitySlug(entity);

  if (routeRoot && entity.id) {
    return `/${routeRoot}/${slug}/${encodeURIComponent(getShortRouteId(entity.id))}`;
  }

  if (routeRoot && entity.provider === "deezer" && entity.provider_id) {
    return `/track/deezer/${encodeURIComponent(entity.provider_id)}`;
  }

  const searchQuery = [entity.title, entity.artist_name].filter(Boolean).join(" ") || fallbackSlug;

  return `/search?q=${encodeURIComponent(searchQuery)}`;
}

export function buildEntityLegacyPath(entity: SeoEntityRouteInput) {
  const routeRoot = entity.type === "album" ? "album" : entity.type === "artist" ? "artist" : "track";

  return entity.id ? `/${routeRoot}/${entity.id}` : buildEntityCanonicalPath(entity);
}

export function buildReviewCanonicalPath(review: SeoReviewRouteInput) {
  return `/reviews/${getShortRouteId(review.id)}/${getEntitySlug(review.entities)}`;
}

export function buildReviewLegacyPath(reviewId: string) {
  return `/review/${reviewId}`;
}
