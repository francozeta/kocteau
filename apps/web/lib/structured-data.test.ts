import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EntityPage } from "./queries/entities";
import type { ReviewPageReview } from "./queries/reviews";
import {
  buildFeedPageJsonLd,
  buildHomePageJsonLd,
  buildReviewPageJsonLd,
  buildReviewsPageJsonLd,
  buildTrackPageJsonLd,
} from "./structured-data";

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
    assert.match(reviews.mainEntity.itemListElement[0]!.url,
      /\/reviews\/example-track-example-artist-111111111111$/);
    assert.ok(!JSON.stringify(reviews).includes("/reviews/111111111111/"));
    assert.equal(
      reviews.mainEntity.itemListElement[0]?.item.name,
      "Listening closely",
    );
    assert.deepEqual(
      reviews.breadcrumb.itemListElement.map((crumb) => new URL(crumb.item).pathname),
      ["/", "/reviews"],
    );
  });
});

const entity: EntityPage = {
  id: "e9cfe82b-5a2b-4324-9e85-a861fdbbddf4",
  type: "track",
  title: "White Ferrari",
  artist_name: "Frank Ocean",
  provider: "deezer",
  provider_id: "717273972",
  artist_id: null,
  parent_album_id: null,
  cover_url: null,
  deezer_url: null,
  release_date: null,
  record_type: null,
  disambiguation: null,
  musicbrainz_recording_id: null,
  musicbrainz_release_group_id: null,
  first_release_date: null,
  genres: [],
};

const review: ReviewPageReview = {
  id: "88a81fc1-173b-4909-adb6-e1010a55ae5a",
  title: "A quiet, beautiful memory",
  body: "A careful listening note about melody and the feeling it leaves behind.",
  rating: 4.5,
  likes_count: 0,
  comments_count: 0,
  created_at: "2026-11-16T12:00:00Z",
  author: { username: "listener", display_name: "Listener", avatar_url: null },
  entities: entity,
};

describe("canonical page breadcrumbs", () => {
  for (const [title, expectedName] of [
    [review.title, review.title],
    [null, "White Ferrari review"],
  ]) {
    it(`ends a ${title ? "titled" : "rating-only"} review at its own canonical URL`, () => {
      const data = buildReviewPageJsonLd({ ...review, title, body: title ? review.body : null });
      const graph = data["@graph"];
      assert.ok(graph);
      const page = graph.find((node) => node["@type"] === "WebPage");
      assert.ok(page && "breadcrumb" in page);
      assert.deepEqual(
        page.breadcrumb.itemListElement.map((crumb) => new URL(crumb.item).pathname),
        ["/", "/reviews", "/reviews/white-ferrari-frank-ocean-88a81fc1173b"],
      );
      assert.equal(page.breadcrumb.itemListElement.at(-1)?.name, expectedName);
    });
  }

  it("links a track directly from public home without advertising the retired index", () => {
    const data = buildTrackPageJsonLd({ entity, reviewCount: 1, averageRating: 4.5 });
    const page = data["@graph"].find((node) => node["@type"] === "WebPage");
    assert.ok(page?.breadcrumb);
    assert.deepEqual(
      page.breadcrumb.itemListElement.map((crumb) => new URL(crumb.item).pathname),
      ["/", "/tracks/white-ferrari-frank-ocean-e9cfe82b5a2b"],
    );
  });
});

describe("canonical public landing identity", () => {
  it("identifies the root as the public WebPage instead of the /home alias", () => {
    const data = buildHomePageJsonLd();
    const page = data["@graph"].find((node) => node["@type"] === "WebPage");
    assert.equal(new URL(page?.url ?? "https://invalid.test").pathname, "/");
    assert.equal(page?.["@id"], `${page?.url}#webpage`);
    assert.ok(!JSON.stringify(data).includes("/home"));
  });
});
