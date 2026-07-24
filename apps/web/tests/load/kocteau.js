import http from "k6/http";
import { check, sleep } from "k6";

const profile = (__ENV.K6_PROFILE || "smoke").toLowerCase();
const baseUrl = normalizeBaseUrl(__ENV.K6_BASE_URL || "http://127.0.0.1:3000");
const authCookie = (__ENV.K6_AUTH_COOKIE || "").trim();
const previewCookie = (__ENV.K6_PREVIEW_COOKIE || "").trim();
const vercelBypassSecret = (__ENV.K6_VERCEL_BYPASS_SECRET || "").trim();
const searchQuery = (__ENV.K6_SEARCH_QUERY || "cocteau").trim();
const explicitTrackPath = normalizePath(__ENV.K6_TRACK_PATH || "");
const summaryPath = (__ENV.K6_SUMMARY_PATH || "").trim();

const defaultHeaders = {
  Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
  "User-Agent": `Kocteau-load-readiness/${profile}`,
  ...(previewCookie ? { Cookie: previewCookie } : {}),
  ...(vercelBypassSecret
    ? { "x-vercel-protection-bypass": vercelBypassSecret }
    : {}),
};

const publicSurfaces = {
  landing: scenario("landingSurface", profile),
  canonical_track: scenario("canonicalTrackSurface", profile),
  search: scenario("searchSurface", profile),
};

if (authCookie) {
  publicSurfaces.authenticated_feed = scenario("authenticatedFeedSurface", profile);
}

export const options = {
  discardResponseBodies: true,
  summaryTrendStats: ["avg", "med", "p(75)", "p(90)", "p(95)", "max"],
  scenarios: publicSurfaces,
  thresholds: buildThresholds(Boolean(authCookie)),
};

export function setup() {
  if (explicitTrackPath) {
    return { trackPath: explicitTrackPath };
  }

  const response = http.get(`${baseUrl}/sitemap.xml`, {
    headers: defaultHeaders,
    responseType: "text",
    tags: { surface: "setup" },
  });

  const trackPath = getFirstCanonicalTrackPath(response.body || "");

  if (!trackPath) {
    throw new Error(
      "No canonical track route was found in /sitemap.xml. Set K6_TRACK_PATH explicitly.",
    );
  }

  return { trackPath };
}

export function landingSurface() {
  const response = get("/", "landing");

  check(response, {
    "landing returns 200": (result) => result.status === 200,
  });
  pause();
}

export function canonicalTrackSurface(data) {
  const response = get(data.trackPath, "canonical_track");

  check(response, {
    "canonical track returns 200": (result) => result.status === 200,
  });
  pause();
}

export function searchSurface() {
  const encodedQuery = encodeURIComponent(searchQuery);
  const pageResponse = get(`/search?q=${encodedQuery}`, "search_page");
  const apiResponse = get(`/api/search?q=${encodedQuery}`, "search_api", {
    Accept: "application/json",
  });

  check(pageResponse, {
    "search page returns 200": (result) => result.status === 200,
  });
  check(apiResponse, {
    "search API returns 200": (result) => result.status === 200,
    "search API is JSON": (result) =>
      (result.headers["Content-Type"] || "").includes("application/json"),
  });
  pause();
}

export function authenticatedFeedSurface() {
  const response = get("/feed?view=for-you", "authenticated_feed", {
    Cookie: joinCookies(previewCookie, authCookie),
  });

  check(response, {
    "authenticated feed returns 200": (result) => result.status === 200,
    "authenticated feed does not redirect to login": (result) =>
      !String(result.url).includes("/login"),
  });
  pause();
}

export function handleSummary(data) {
  const output = {
    stdout: formatSummary(data),
  };

  if (summaryPath) {
    output[summaryPath] = JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        target: baseUrl,
        profile,
        authenticatedFeedIncluded: Boolean(authCookie),
        protectedPreviewBypassIncluded: Boolean(previewCookie || vercelBypassSecret),
        data,
      },
      null,
      2,
    );
  }

  return output;
}

function get(path, surface, extraHeaders = {}) {
  return http.get(`${baseUrl}${path}`, {
    headers: { ...defaultHeaders, ...extraHeaders },
    redirects: 0,
    tags: { surface },
  });
}

function scenario(exec, selectedProfile) {
  if (selectedProfile === "baseline") {
    return {
      executor: "ramping-vus",
      exec,
      startVUs: 0,
      stages: [
        { duration: "20s", target: 1 },
        { duration: "40s", target: 3 },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "10s",
      tags: { profile: selectedProfile },
    };
  }

  if (selectedProfile !== "smoke") {
    throw new Error(`Unsupported K6_PROFILE: ${selectedProfile}`);
  }

  return {
    executor: "shared-iterations",
    exec,
    vus: 1,
    iterations: 3,
    maxDuration: "45s",
    tags: { profile: selectedProfile },
  };
}

function buildThresholds(includeAuthenticatedFeed) {
  const thresholds = {
    checks: ["rate>0.99"],
    "http_req_failed{surface:landing}": ["rate<0.01"],
    "http_req_duration{surface:landing}": ["p(75)<800", "p(95)<1500"],
    "http_req_failed{surface:canonical_track}": ["rate<0.01"],
    "http_req_duration{surface:canonical_track}": [
      "p(75)<1200",
      "p(95)<2500",
    ],
    "http_req_failed{surface:search_page}": ["rate<0.01"],
    "http_req_duration{surface:search_page}": ["p(75)<1000", "p(95)<2000"],
    "http_req_failed{surface:search_api}": ["rate<0.02"],
    "http_req_duration{surface:search_api}": ["p(75)<1500", "p(95)<3000"],
  };

  if (includeAuthenticatedFeed) {
    thresholds["http_req_failed{surface:authenticated_feed}"] = ["rate<0.01"];
    thresholds["http_req_duration{surface:authenticated_feed}"] = [
      "p(75)<1200",
      "p(95)<2500",
    ];
  }

  return thresholds;
}

function getFirstCanonicalTrackPath(sitemap) {
  const match = sitemap.match(/<loc>https?:\/\/[^<]+(\/tracks\/[^<]+)<\/loc>/i);
  return match?.[1] ? decodeXml(match[1]) : "";
}

function decodeXml(value) {
  return value.replaceAll("&amp;", "&");
}

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function normalizePath(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function joinCookies(...cookies) {
  return cookies.filter(Boolean).join("; ");
}

function pause() {
  sleep(0.35 + Math.random() * 0.65);
}

function formatSummary(data) {
  const lines = [
    "",
    `Kocteau load-readiness (${profile})`,
    `Target: ${baseUrl}`,
    `Authenticated feed: ${authCookie ? "included" : "skipped"}`,
    "",
  ];

  for (const surface of [
    "landing",
    "canonical_track",
    "search_page",
    "search_api",
    "authenticated_feed",
  ]) {
    const duration = data.metrics[`http_req_duration{surface:${surface}}`]?.values;
    const failures = data.metrics[`http_req_failed{surface:${surface}}`]?.values;

    if (!duration) {
      continue;
    }

    lines.push(
      `${surface}: p75=${round(duration["p(75)"])}ms p95=${round(duration["p(95)"])}ms failures=${percent(failures?.rate)}`,
    );
  }

  lines.push("");
  return lines.join("\n");
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value) : "n/a";
}

function percent(value) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : "n/a";
}
