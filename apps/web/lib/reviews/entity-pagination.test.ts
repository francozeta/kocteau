import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodeEntityReviewCursor,
  encodeEntityReviewCursor,
  ENTITY_REVIEW_PAGE_SIZE,
  getEntityReviewPage,
  getEntityReviewPageHref,
} from "./entity-pagination";

const row = (n: number) => ({
  id: `74000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  created_at: "2026-10-21T12:00:00.123456+00:00",
});

test("empty and exact-size pages have no continuation", () => {
  assert.deepEqual(getEntityReviewPage([]), { reviews: [], nextCursor: null });
  const rows = Array.from({ length: ENTITY_REVIEW_PAGE_SIZE }, (_, i) => row(i));
  assert.deepEqual(getEntityReviewPage(rows), { reviews: rows, nextCursor: null });
});

test("the cursor points to the last visible review, preserving timestamp precision", () => {
  const rows = Array.from({ length: ENTITY_REVIEW_PAGE_SIZE + 1 }, (_, i) => row(i));
  const page = getEntityReviewPage(rows);
  assert.equal(page.reviews.length, ENTITY_REVIEW_PAGE_SIZE);
  assert.deepEqual(decodeEntityReviewCursor(page.nextCursor), rows[ENTITY_REVIEW_PAGE_SIZE - 1]);
  assert.equal(rows.length, ENTITY_REVIEW_PAGE_SIZE + 1);
});

test("malformed cursors cannot enter database filter syntax", () => {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  for (const cursor of [
    "", "not-json", "a".repeat(257),
    encode({ ...row(1), id: "x),rating.gt.0" }),
    encode({ ...row(1), created_at: "2026-10-21T12:00:00Z),id.gt.0" }),
    encode({ ...row(1), created_at: "2026-02-31T12:00:00Z" }),
    encode({ ...row(1), created_at: "0000-10-21T12:00:00Z" }),
    encode({ ...row(1), created_at: "2026-10-21T12:00:00+16:00" }),
    encode({ ...row(1), unexpected: "extra" }),
    encode(null), encode([]),
  ]) assert.equal(decodeEntityReviewCursor(cursor), null, cursor);
  assert.deepEqual(decodeEntityReviewCursor(encodeEntityReviewCursor(row(1))), row(1));
});

test("review page links stay on the canonical track route and anchor", () => {
  const path = "/tracks/song-artist/0123456789ab";
  const cursor = encodeEntityReviewCursor(row(1));
  const next = new URL(getEntityReviewPageHref(path, cursor), "https://kocteau.test");
  assert.equal(next.pathname, path);
  assert.equal(next.searchParams.get("reviewsAfter"), cursor);
  assert.equal(next.hash, "#reviews");
  assert.equal(getEntityReviewPageHref(path), path + "#reviews");
});
