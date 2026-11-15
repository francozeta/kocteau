import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ReviewPageReview } from "./queries/reviews";
import { buildFeedPageJsonLd, buildReviewPageJsonLd, buildReviewsPageJsonLd } from "./structured-data";
import { buildReviewCanonicalPath } from "./seo-routes";

describe("review collection structured data", () => {
  it("only advertises substantial public reviews as structured review nodes", () => {
    const entries: Parameters<typeof buildReviewsPageJsonLd>[0] = [
      {
        reviewId: "11111111-1111-4111-8111-111111111111",
        reviewTitle: "Listening closely",
        reviewBody:
          "A detailed listening note that follows the gradual shifts in the song, its quiet opening, and how each new sound changes the mood.",
        rating: 4,
        entity: {
          id: "22222222-2222-4222-8222-222222222222",
          provider: "deezer",
          providerId: "123",
          type: "track",
          title: "Example track",
          artistName: "Example artist",
        },
        author: { username: "listener" },
      },
      {
        reviewId: "33333333-3333-4333-8333-333333333333",
        reviewTitle: "Nice",
        reviewBody: "Short note",
        rating: 5,
        entity: {
          id: "22222222-2222-4222-8222-222222222222",
          provider: "deezer",
          providerId: "123",
          type: "track",
          title: "Example track",
        },
        author: { username: "listener" },
      },
    ];

    const reviews = buildReviewsPageJsonLd(entries);
    const home = buildFeedPageJsonLd(entries);
    assert.equal(reviews.mainEntity.numberOfItems, 1);
    assert.equal(reviews.mainEntity.itemListElement.length, 1);
    assert.equal(home.mainEntity.numberOfItems, 1);
    assert.equal(home.mainEntity.itemListElement.length, 1);
    assert.equal(
      reviews.mainEntity.itemListElement[0]?.item.name,
      "Listening closely",
    );
  });
});

describe("review page structured data", () => {
  it("uses the canonical review URL as the final breadcrumb", () => {
    const review = {
      id: "88a81fc1-173b-4909-adb6-e1010a55ae5a",
      title: "A quiet, beautiful memory",
      body: "A careful listening note about melody and the feeling it leaves behind.",
      rating: 4.5,
      author: { username: "listener", display_name: "Listener" },
      entities: {
        id: "e9cfe82b-5a2b-4324-9e85-a861fdbbddf4",
        type: "track",
        title: "White Ferrari",
        artist_name: "Frank Ocean",
        provider: "deezer",
        provider_id: "717273972",
        cover_url: null,
        deezer_url: null,
      },
    } as unknown as ReviewPageReview;

    const data = buildReviewPageJsonLd(review) as {
      "@graph": Array<{
        "@type": string;
        breadcrumb?: {
          itemListElement: Array<{ item: string; name: string }>;
        };
      }>;
    };
    const page = data["@graph"].find((node) => node["@type"] === "WebPage");

    assert.ok(page?.breadcrumb);
    const breadcrumbs = page.breadcrumb.itemListElement;
    assert.deepEqual(
      breadcrumbs.map((crumb) => new URL(crumb.item).pathname),
      ["/home", "/reviews", buildReviewCanonicalPath(review)],
    );
    assert.equal(breadcrumbs[2]?.name, review.title);
  });
});
