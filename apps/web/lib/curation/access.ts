import "server-only";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function requireStarterCurator() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  const { data: hasAccess, error } = await supabase.rpc("is_starter_curator");

  if (error) {
    console.error("[curation.requireStarterCurator] failed", {
      code: error.code ?? null,
      message: error.message ?? null,
    });

    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Starter curator roles are not configured." },
        { status: 500 },
      ),
    };
  }

  if (!hasAccess) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Not allowed" }, { status: 403 }),
    };
  }

  return { ok: true as const, supabase };
}

export async function requireKocteauAdmin() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  const { data: hasAccess, error } = await supabase.rpc("is_kocteau_admin");

  if (error) {
    console.error("[curation.requireKocteauAdmin] failed", {
      code: error.code ?? null,
      message: error.message ?? null,
    });

    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Kocteau admin roles are not configured." },
        { status: 500 },
      ),
    };
  }

  if (!hasAccess) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Not allowed" }, { status: 403 }),
    };
  }

  return { ok: true as const, supabase, user };
}
