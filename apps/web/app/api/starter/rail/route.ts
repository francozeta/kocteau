import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import {
  getPublicStarterTracks,
  getStarterTracksForSurface,
} from "@/lib/queries/starter";
import {
  getStarterContextKey,
  isStarterSurface,
  type StarterSurface,
} from "@/lib/starter/surface";

function getRailLimit(req: Request) {
  const url = new URL(req.url);
  const parsedLimit = Number(url.searchParams.get("limit") ?? 6);

  if (!Number.isFinite(parsedLimit)) {
    return 6;
  }

  return Math.max(1, Math.min(Math.trunc(parsedLimit), 12));
}

function getRailSurface(req: Request): StarterSurface {
  const url = new URL(req.url);
  const surface = url.searchParams.get("surface");

  return isStarterSurface(surface) ? surface : "app";
}

function getRailContextKey(req: Request, surface: StarterSurface) {
  const url = new URL(req.url);
  const explicitContext = url.searchParams.get("context")?.trim();

  if (explicitContext) {
    return explicitContext.slice(0, 120);
  }

  return surface === "app" ? getStarterContextKey(null) : surface;
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const surface = getRailSurface(req);
  const limit = getRailLimit(req);
  const contextKey = getRailContextKey(req, surface);

  if (!user) {
    const tracks = await getPublicStarterTracks({
      limit,
      contextKey,
    });

    return NextResponse.json({ tracks });
  }

  const tracks = await getStarterTracksForSurface({
    viewerId: user.id,
    limit,
    surface,
    contextKey,
  });

  return NextResponse.json({ tracks });
}
