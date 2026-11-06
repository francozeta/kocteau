import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { openApiDocument } from "./agent-openapi";

describe("published OpenAPI contract", () => {
  it("is a valid OpenAPI 3.1 document for actual read-only routes", () => {
    assert.equal(openApiDocument.openapi, "3.1.0");
    assert.equal(openApiDocument.servers[0].url, "https://kocteau.com");
    assert.ok(openApiDocument.paths["/api/search"].get.responses["200"]);
    assert.ok(openApiDocument.paths["/api/feed"].get.responses["200"]);
    assert.deepEqual(Object.keys(openApiDocument.paths), ["/api/search", "/api/feed"]);
    assert.equal(openApiDocument.components.schemas.ApiError.required.includes("hint"), true);
    assert.equal(JSON.parse(JSON.stringify(openApiDocument)).openapi, "3.1.0");
  });
});
