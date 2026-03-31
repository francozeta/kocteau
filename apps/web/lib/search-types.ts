export const searchableEntityTypes = ["track", "artist", "album"] as const;

export type SearchEntityType = (typeof searchableEntityTypes)[number];

export function isSearchEntityType(value: string | null | undefined): value is SearchEntityType {
  return searchableEntityTypes.includes(value as SearchEntityType);
}
