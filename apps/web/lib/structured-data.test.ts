import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFeedPageJsonLd, buildHomePageJsonLd, buildReviewsPageJsonLd, buildSiteGraphJsonLd } from "./structured-data";

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

describe("public product discovery", () => {
  it("uses consistent concrete product terms in its JSON-LD", () => {
    const website = buildSiteGraphJsonLd()["@graph"].find((node) => node["@type"] === "WebSite");
    const app = buildHomePageJsonLd()["@graph"].find((node) => node["@type"] === "WebApplication");
    assert.ok(website && "keywords" in website);
    assert.ok(app && "keywords" in app);
    assert.match(JSON.stringify(website), /music reviews/);
    assert.match(JSON.stringify(app), /music discovery/);
  });
});
