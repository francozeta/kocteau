export type PendingReviewDraftSelection = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  entity_id?: string | null;
};

export type PendingReviewDraft = {
  selection: PendingReviewDraftSelection;
  rating: number | null;
  title: string;
  body: string;
};

export type StoredPendingReviewDraft = PendingReviewDraft & {
  version: 1;
  createdAt: number;
};

export const pendingReviewDraftStorageKey = "kocteau:pending-review-draft";

export function getPendingReviewDraftReturnPath() {
  return "/?compose=1&draft=review";
}

export function getPendingReviewDraftLoginPath() {
  const params = new URLSearchParams({
    next: getPendingReviewDraftReturnPath(),
  });

  return `/login?${params.toString()}`;
}

function getBrowserStorage(storage?: Storage) {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeStoredDraft(value: unknown): StoredPendingReviewDraft | null {
  if (!isRecord(value) || value.version !== 1) {
    return null;
  }

  const selection = value.selection;

  if (!isRecord(selection)) {
    return null;
  }

  if (
    selection.provider !== "deezer" ||
    selection.type !== "track" ||
    typeof selection.provider_id !== "string" ||
    typeof selection.title !== "string"
  ) {
    return null;
  }

  const rating =
    typeof value.rating === "number" && Number.isFinite(value.rating)
      ? value.rating
      : null;

  return {
    version: 1,
    createdAt: typeof value.createdAt === "number" ? value.createdAt : Date.now(),
    selection: {
      provider: "deezer",
      provider_id: selection.provider_id,
      type: "track",
      title: selection.title,
      artist_name: normalizeNullableString(selection.artist_name),
      cover_url: normalizeNullableString(selection.cover_url),
      deezer_url: normalizeNullableString(selection.deezer_url),
      entity_id: normalizeNullableString(selection.entity_id),
    },
    rating,
    title: typeof value.title === "string" ? value.title : "",
    body: typeof value.body === "string" ? value.body : "",
  };
}

export function savePendingReviewDraft(
  draft: PendingReviewDraft,
  storage?: Storage,
) {
  const targetStorage = getBrowserStorage(storage);

  if (!targetStorage) {
    return false;
  }

  const storedDraft = {
    ...draft,
    version: 1,
    createdAt: Date.now(),
  } satisfies StoredPendingReviewDraft;

  targetStorage.setItem(pendingReviewDraftStorageKey, JSON.stringify(storedDraft));
  return true;
}

export function readPendingReviewDraft(storage?: Storage) {
  const targetStorage = getBrowserStorage(storage);

  if (!targetStorage) {
    return null;
  }

  const rawDraft = targetStorage.getItem(pendingReviewDraftStorageKey);

  if (!rawDraft) {
    return null;
  }

  try {
    return normalizeStoredDraft(JSON.parse(rawDraft));
  } catch {
    return null;
  }
}

export function clearPendingReviewDraft(storage?: Storage) {
  const targetStorage = getBrowserStorage(storage);

  if (!targetStorage) {
    return;
  }

  targetStorage.removeItem(pendingReviewDraftStorageKey);
}
