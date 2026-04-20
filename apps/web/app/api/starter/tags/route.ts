import { NextResponse } from "next/server";
import { requireStarterCurator } from "@/lib/curation/access";
import { starterPreferenceTagSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function POST(req: Request) {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = starterPreferenceTagSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Starter tag is invalid.");
  }

  const tag = parsed.data;
  const { data, error } = await curator.supabase.rpc("upsert_preference_tag", {
    p_kind: tag.kind,
    p_label: tag.label,
    p_slug: null,
    p_description: tag.description,
    p_is_featured: tag.is_featured,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "We could not save that tag." },
      { status: error.code === "42501" ? 403 : 500 },
    );
  }

  return NextResponse.json({ ok: true, tag: data });
}
