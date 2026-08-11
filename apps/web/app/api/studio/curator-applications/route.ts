import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireKocteauAdmin } from "@/lib/curation/access";
import { curatorApplicationDecisionSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

function decisionErrorResponse(error: {
  code?: string | null;
  message?: string | null;
}) {
  if (error.code === "42501") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  if (error.code === "02000") {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (error.code === "22023") {
    return NextResponse.json(
      { error: error.message ?? "This application can no longer be changed." },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { error: "We could not update the curator application." },
    { status: 500 },
  );
}

export async function PATCH(request: Request) {
  const admin = await requireKocteauAdmin();

  if (!admin.ok) {
    return admin.response;
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const parsed = curatorApplicationDecisionSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Curator decision is invalid.");
  }

  const { data, error } = await admin.supabase.rpc(
    "decide_curator_application",
    {
      p_application_id: parsed.data.id,
      p_status: parsed.data.status,
      p_decision_note: parsed.data.decision_note ?? undefined,
    },
  );

  if (error) {
    console.error("[studio.curator-applications.decide] failed", {
      code: error.code ?? null,
      message: error.message ?? null,
      adminId: admin.user.id,
      applicationId: parsed.data.id,
    });

    return decisionErrorResponse(error);
  }

  revalidatePath("/curators");
  revalidatePath("/studio/curators");

  return NextResponse.json({ application: data });
}
