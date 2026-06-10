export const entityLibraryItemTypes = ["listen_later", "review_later"] as const;

export type EntityLibraryItemType = (typeof entityLibraryItemTypes)[number];

export type EntityLibraryState = Record<EntityLibraryItemType, boolean>;

const entityLibraryItemTypeSet = new Set<string>(entityLibraryItemTypes);

export function isEntityLibraryItemType(value: unknown): value is EntityLibraryItemType {
  return typeof value === "string" && entityLibraryItemTypeSet.has(value);
}

export function getEmptyEntityLibraryState(): EntityLibraryState {
  return {
    listen_later: false,
    review_later: false,
  };
}

export function getNextEntityLibraryState(
  state: EntityLibraryState,
  itemType: EntityLibraryItemType,
  active: boolean,
): EntityLibraryState {
  return {
    ...state,
    [itemType]: active,
  };
}

export function getEntityLibraryItemLabel(itemType: EntityLibraryItemType) {
  return itemType === "listen_later" ? "Listen later" : "Review later";
}
