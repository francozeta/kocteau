import { NextResponse } from "next/server";

const DEFAULT_OPENPANEL_API_URL = "https://api.openpanel.dev";
const DEFAULT_OPENPANEL_SCRIPT_URL = "https://openpanel.dev/op1.js";

function getBaseUrl(value: string | undefined, fallback: string) {
  const url = value?.trim() || fallback;

  return url.replace(/\/$/, "");
}

function buildForwardHeaders(req: Request) {
  const headers = new Headers();
  const clientId = req.headers.get("openpanel-client-id");
  const origin = req.headers.get("origin");

  headers.set("Content-Type", "application/json");

  if (clientId) {
    headers.set("openpanel-client-id", clientId);
  }

  if (origin) {
    headers.set("origin", origin);
  }

  return headers;
}

async function proxyScript(req: Request) {
  const url = new URL(req.url);
  const scriptUrl = new URL(
    getBaseUrl(process.env.OPENPANEL_SCRIPT_URL, DEFAULT_OPENPANEL_SCRIPT_URL),
  );

  url.searchParams.forEach((value, key) => {
    scriptUrl.searchParams.set(key, value);
  });

  const response = await fetch(scriptUrl, {
    next: {
      revalidate: 86_400,
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch OpenPanel script." },
      { status: response.status },
    );
  }

  return new Response(await response.text(), {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      "Content-Type": "text/javascript; charset=utf-8",
    },
  });
}

async function proxyTrack(req: Request) {
  const url = new URL(req.url);
  const trackIndex = url.pathname.indexOf("/track");

  if (trackIndex === -1) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const apiUrl = getBaseUrl(
    process.env.OPENPANEL_API_URL,
    DEFAULT_OPENPANEL_API_URL,
  );
  const trackPath = url.pathname.slice(trackIndex);
  const response = await fetch(`${apiUrl}${trackPath}`, {
    method: req.method,
    headers: buildForwardHeaders(req),
    body: req.method === "POST" ? await req.text() : undefined,
    cache: "no-store",
  });
  const headers = new Headers();
  const contentType = response.headers.get("content-type");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return new Response(await response.text(), {
    status: response.status,
    headers,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  if (url.pathname.endsWith("/op1.js")) {
    return proxyScript(req);
  }

  return proxyTrack(req);
}

export async function POST(req: Request) {
  return proxyTrack(req);
}
