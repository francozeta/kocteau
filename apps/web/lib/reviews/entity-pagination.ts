import { z } from "zod";

export const ENTITY_REVIEW_PAGE_SIZE = 12;

const cursorSchema = z.object({
  created_at: z.iso.datetime({ offset: true }).refine((value) =>
    !value.startsWith("0000-") && (value.endsWith("Z") || Number(value.slice(-5, -3)) < 16),
  ),
  id: z.uuid(),
}).strict();

export type EntityReviewCursor = z.infer<typeof cursorSchema>;

export function decodeEntityReviewCursor(value: string | null | undefined): EntityReviewCursor | null {
  if (typeof value !== "string" || !value || value.length > 256 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const result = cursorSchema.safeParse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function encodeEntityReviewCursor(review: EntityReviewCursor) {
  return Buffer.from(JSON.stringify({ created_at: review.created_at, id: review.id })).toString("base64url");
}

export function getEntityReviewPage<T extends EntityReviewCursor>(rows: T[]) {
  const reviews = rows.slice(0, ENTITY_REVIEW_PAGE_SIZE);
  const last = reviews.at(-1);
  return {
    reviews,
    nextCursor: rows.length > ENTITY_REVIEW_PAGE_SIZE && last
      ? encodeEntityReviewCursor(last)
      : null,
  };
}

export function getEntityReviewPageHref(path: string, cursor?: string | null) {
  return cursor
    ? `${path}?reviewsAfter=${encodeURIComponent(cursor)}#reviews`
    : `${path}#reviews`;
}
