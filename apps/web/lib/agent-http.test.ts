import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendVaryAccept, homepageMarkdown, isUnknownTopLevelPage,
  markdownNotFoundBody, markdownPageResponse, preferredPageRepresentation,
} from "./agent-http";

describe("public document content negotiation", () => {
  it("serves Markdown only when selected by Accept quality and specificity", () => {
    assert.equal(preferredPageRepresentation("text/markdown"), "markdown");
    assert.equal(preferredPageRepresentation("text/markdown, text/html;q=0.8"), "markdown");
    assert.equal(preferredPageRepresentation("text/html, text/markdown;q=0.5"), "html");
    assert.equal(preferredPageRepresentation("text/html,application/xhtml+xml,*/*"), "html");
    assert.equal(preferredPageRepresentation("text/markdown;q=0, text/html"), "html");
    assert.equal(preferredPageRepresentation("text/html;q=0, */*;q=1"), "markdown");
    assert.equal(preferredPageRepresentation("application/json"), "not-acceptable");
    assert.equal(preferredPageRepresentation(null), "html");
  });

  it("preserves other Vary entries and does not duplicate Accept", () => {
    const headers = new Headers({ Vary: "rsc, next-router-prefetch" });
    appendVaryAccept(headers);
    appendVaryAccept(headers);
    assert.equal(headers.get("Vary"), "rsc, next-router-prefetch, Accept");
  });

  it("returns genuine Markdown 404s with a useful index and noindex", async () => {
    const response = markdownPageResponse(markdownNotFoundBody(), 404);
    assert.equal(response.status, 404);
    assert.match(response.headers.get("Content-Type") ?? "", /^text\/markdown/);
    assert.match(response.headers.get("Vary") ?? "", /Accept/);
    assert.match(response.headers.get("X-Robots-Tag") ?? "", /noindex/);
    assert.match(await response.text(), /https:\/\/kocteau.com\/llms.txt/);
    assert.equal((await markdownPageResponse("ignored", 404, "HEAD").text()), "");
  });

  it("limits missing-route interception to unfamiliar top-level pages", () => {
    assert.equal(isUnknownTopLevelPage("/missing-page"), true);
    assert.equal(isUnknownTopLevelPage("/__ora-404-probe-8htkg496"), true);
    assert.equal(isUnknownTopLevelPage("/"), false);
    assert.equal(isUnknownTopLevelPage("/reviews/a/b"), false);
    assert.equal(isUnknownTopLevelPage("/docs/api"), false);
    assert.equal(isUnknownTopLevelPage("/.well-known/assetlinks.json"), false);
  });

  it("supplies meaningful public product copy without JavaScript", () => {
    assert.ok(homepageMarkdown.length >= 500);
    assert.match(homepageMarkdown, /^# Kocteau/);
    assert.match(homepageMarkdown, /https:\/\/kocteau.com\/openapi.json/);
  });
});
