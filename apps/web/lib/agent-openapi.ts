// Public read endpoints only. Private mutations/auth endpoints are intentionally not advertised.
export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Kocteau Public API",
    version: "0.3.15",
    description: "Read-only access to Kocteau public music catalog search and public review feed. Personal actions require authentication and are not part of this public contract.",
  },
  servers: [{ url: "https://kocteau.com" }],
  paths: {
    "/api/search": {
      get: {
        operationId: "searchMusic",
        summary: "Find public music catalog candidates",
        description: "Search tracks, albums or artists. An empty query returns an empty array. Catalog results are metadata, not listener reviews.",
        parameters: [
          { name: "q", in: "query", description: "Music to find; at most 80 characters.", schema: { type: "string", maxLength: 80 } },
          { name: "type", in: "query", schema: { type: "string", enum: ["all", "track", "artist", "album"], default: "all" } },
          { name: "source", in: "query", schema: { type: "string", enum: ["all", "local", "remote"], default: "all" } },
        ],
        responses: {
          "200": { description: "Music catalog candidates", content: { "application/json": { schema: { type: "array", items: { type: "object", additionalProperties: true } } } } },
          "400": { $ref: "#/components/responses/BadRequest" },
          "502": { $ref: "#/components/responses/UpstreamUnavailable" },
        },
      },
    },
    "/api/feed": {
      get: {
        operationId: "getPublicFeed",
        summary: "Read publicly available recent music reviews",
        description: "Without a logged-in session, returns the latest public review feed. Personalized views may require a user session.",
        parameters: [
          { name: "view", in: "query", description: "Feed view; guest defaults to latest.", schema: { type: "string", enum: ["latest", "for-you", "following", "top-rated"] } },
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Feed bundle. Review objects and viewer flags may evolve.",
            content: { "application/json": { schema: {
              type: "object",
              required: ["feed", "activeUsers", "view", "requiresAuth"],
              properties: {
                feed: { type: "array", items: { type: "object", additionalProperties: true } },
                activeUsers: { type: "array", items: { type: "object", additionalProperties: true } },
                nextCursor: { type: ["string", "null"] },
                view: { type: "string" },
                requiresAuth: { type: "boolean" },
              },
              additionalProperties: true,
            } } },
          },
          "503": { $ref: "#/components/responses/ServiceUnavailable" },
        },
      },
    },
  },
  components: {
    schemas: {
      ApiError: {
        type: "object",
        required: ["error", "code", "message", "hint"],
        properties: {
          error: { type: "string", description: "Legacy-compatible human-readable error." },
          code: { type: "string", description: "Stable machine-readable error code." },
          message: { type: "string" },
          hint: { type: "string", description: "How to retry or correct the request." },
          fieldErrors: { type: "object", additionalProperties: true },
          formErrors: { type: "array", items: { type: "string" } },
        },
      },
    },
    responses: {
      BadRequest: { description: "Invalid query parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
      UpstreamUnavailable: { description: "Music provider temporarily unavailable", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
      ServiceUnavailable: { description: "Review service temporarily unavailable", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
    },
  },
} as const;
