export type CatalogSource = "deezer" | "musicbrainz";
export const catalogResearchVersion = 2;
export type EvidenceClass = "fact" | "community" | "editorial" | "inferred" | "human";
export type CatalogSourceEntityType =
  | "track"
  | "album"
  | "artist"
  | "recording"
  | "release-group";

export type CatalogLookup = {
  provider: string;
  providerId: string;
  type: "track" | "album" | "artist";
  title: string;
  artistName: string | null;
  researchVersion?: number;
};

type CatalogFacts = Record<string, string | number | string[]>;

export type ResolvedCatalogSource = {
  sourceEntityId: string;
  matchScore: number | null;
  facts: CatalogFacts;
};

export type CatalogSourceObservation = {
  source: CatalogSource;
  sourceEntityType: CatalogSourceEntityType;
  lookup: CatalogLookup;
  schemaVersion: 1;
  retrievedAt: string;
} & (
  | (ResolvedCatalogSource & { status: "resolved"; errorCode: null })
  | {
      status: "no_match";
      sourceEntityId: null;
      matchScore: null;
      facts: CatalogFacts;
      errorCode: null;
    }
  | {
      status: "failed";
      sourceEntityId: null;
      matchScore: null;
      facts: CatalogFacts;
      errorCode: "request_failed";
    }
);

export function catalogFieldEvidenceClass(source: {
  source: string;
  source_entity_type: string;
  status: string;
  lookup: unknown;
}, field: string): EvidenceClass | null {
  if (source.status !== "resolved" || !source.lookup || typeof source.lookup !== "object" ||
    Array.isArray(source.lookup) ||
    (source.lookup as { researchVersion?: unknown }).researchVersion !== catalogResearchVersion) return null;

  if (source.source === "musicbrainz" &&
    ["artist", "recording", "release-group"].includes(source.source_entity_type)) {
    if (["tags", "prominent_tags"].includes(field)) return "community";
    if (["first_release_date", "record_type", "artist_type", "country_code",
      "life_span_begin", "life_span_end"].includes(field)) return "fact";
  }
  if (source.source === "deezer" && ["track", "album"].includes(source.source_entity_type) &&
    ["title", "artist_name", "artist_id", "album_id", "album_title", "release_date",
      "record_type", "album_record_type", "isrc", "duration_seconds"].includes(field)) return "fact";

  return null;
}

export async function collectCatalogSource<T>({
  source,
  sourceEntityType,
  lookup,
  fetchSource,
  normalize,
  persist,
  now = () => new Date().toISOString(),
}: {
  source: CatalogSource;
  sourceEntityType: CatalogSourceEntityType;
  lookup: CatalogLookup;
  fetchSource: () => Promise<T | null>;
  normalize: (value: T) => ResolvedCatalogSource;
  persist: (observation: CatalogSourceObservation) => Promise<void>;
  now?: () => string;
}): Promise<T | null> {
  const context = { source, sourceEntityType, lookup, schemaVersion: 1 as const };
  let result: T | null;
  let resolved: ResolvedCatalogSource | null;

  try {
    result = await fetchSource();
    resolved = result === null ? null : normalize(result);
  } catch {
    await persist({
      ...context,
      retrievedAt: now(),
      status: "failed",
      sourceEntityId: null,
      matchScore: null,
      facts: {},
      errorCode: "request_failed",
    });
    throw new Error(`${source} ${sourceEntityType} evidence request failed.`);
  }

  await persist(resolved ? {
    ...context,
    ...resolved,
    retrievedAt: now(),
    status: "resolved",
    errorCode: null,
  } : {
    ...context,
    retrievedAt: now(),
    status: "no_match",
    sourceEntityId: null,
    matchScore: null,
    facts: {},
    errorCode: null,
  });

  return result;
}

export function catalogFacts(
  fields: Record<string, string | number | string[] | null | undefined>,
): CatalogFacts {
  return Object.fromEntries(
    Object.entries(fields).filter(
      (entry): entry is [string, string | number | string[]] => {
        const value = entry[1];
        return value !== null && value !== undefined && value !== "" &&
          (!Array.isArray(value) || value.length > 0);
      },
    ),
  );
}
