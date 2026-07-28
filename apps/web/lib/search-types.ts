export const searchableEntityTypes = ["track", "artist", "album"] as const;
export const searchScopes = ["all", ...searchableEntityTypes] as const;

export type SearchEntityType = (typeof searchableEntityTypes)[number];
export type SearchScope = (typeof searchScopes)[number];

export function isSearchEntityType(value: string | null | undefined): value is SearchEntityType {
  return searchableEntityTypes.includes(value as SearchEntityType);
}

export function isSearchScope(value: string | null | undefined): value is SearchScope {
  return searchScopes.includes(value as SearchScope);
}
