export type CatalogSource = "deezer" | "musicbrainz";
export const catalogResearchVersion = 2;
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
