import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireStarterCurator } from "@/lib/curation/access";
import { backfillDeezerMusicLinks } from "@/lib/music-links";
import { musicLinksBackfillSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function POST(req: Request) {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const payload = (await req.json().catch(() => ({}))) as unknown;
  const parsed = musicLinksBackfillSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Backfill request is invalid.");
  }

  try {
    const result = await backfillDeezerMusicLinks(parsed.data);

    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Music link resolver is not configured.",
          result,
        },
        { status: 500 },
      );
    }

    revalidateTag("entities", "max");
    revalidatePath("/");
    revalidatePath("/track");
    revalidatePath("/studio/starter");

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Music link backfill failed.",
      },
      { status: 500 },
    );
  }
}
