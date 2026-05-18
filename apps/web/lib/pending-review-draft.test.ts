import assert from "node:assert/strict";
import test from "node:test";
import {
  clearPendingReviewDraft,
  getPendingReviewDraftLoginPath,
  getPendingReviewDraftReturnPath,
  readPendingReviewDraft,
  savePendingReviewDraft,
  type PendingReviewDraft,
} from "@/lib/pending-review-draft";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const draft = {
  selection: {
    provider: "deezer",
    provider_id: "123",
    type: "track",
    title: "Sea, Swallow Me",
    artist_name: "Cocteau Twins",
    cover_url: "https://example.com/cover.jpg",
    deezer_url: "https://deezer.page/track/123",
    entity_id: null,
  },
  rating: 4.5,
  title: "Drowning in softness",
  body: "Everything feels weightless here.",
} satisfies PendingReviewDraft;

test("pending review draft can be saved, read, and cleared", () => {
  const storage = new MemoryStorage();

  savePendingReviewDraft(draft, storage);

  assert.deepEqual(readPendingReviewDraft(storage), {
    ...draft,
    createdAt: readPendingReviewDraft(storage)?.createdAt,
    version: 1,
  });

  clearPendingReviewDraft(storage);
  assert.equal(readPendingReviewDraft(storage), null);
});

test("pending review draft ignores malformed payloads", () => {
  const storage = new MemoryStorage();

  storage.setItem("kocteau:pending-review-draft", "{");

  assert.equal(readPendingReviewDraft(storage), null);
});

test("pending review draft routes back to the composer through login", () => {
  assert.equal(getPendingReviewDraftReturnPath(), "/?compose=1&draft=review");
  assert.equal(
    getPendingReviewDraftLoginPath(),
    "/login?next=%2F%3Fcompose%3D1%26draft%3Dreview",
  );
});
