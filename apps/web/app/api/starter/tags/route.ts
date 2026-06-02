import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireStarterCurator } from "@/lib/curation/access";
import {
  starterPreferenceTagSchema,
  starterPreferenceTagUpdateSchema,
} from "@/lib/validation/schemas";
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
    p_slug: undefined,
    p_description: tag.description ?? undefined,
    p_is_featured: tag.is_featured,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "We could not save that tag." },
      { status: error.code === "42501" ? 403 : 500 },
    );
  }

  revalidatePath("/studio/starter");

  return NextResponse.json({ ok: true, tag: data });
}

export async function PATCH(req: Request) {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = starterPreferenceTagUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Starter tag is invalid.");
  }

  const tag = parsed.data;
  const { data, error } = await curator.supabase.rpc("update_preference_tag", {
    p_tag_id: tag.id,
    p_kind: tag.kind,
    p_label: tag.label,
    p_description: tag.description ?? undefined,
    p_is_featured: tag.is_featured,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "We could not update that tag." },
      { status: error.code === "42501" ? 403 : 500 },
    );
  }

  revalidatePath("/studio/starter");

  return NextResponse.json({ ok: true, tag: data });
}
