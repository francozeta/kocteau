import { NextResponse } from "next/server";
import { z } from "zod";
import { formatZodError } from "@/lib/validation/errors";

export function validationErrorResponse(
  error: z.ZodError,
  fallbackMessage = "Please review the highlighted fields.",
) {
  const formatted = formatZodError(error);

  return NextResponse.json(
    {
      error: formatted.message ?? fallbackMessage,
      code: "VALIDATION_ERROR",
      message: formatted.message ?? fallbackMessage,
      hint: "Review the invalid query or field values and retry.",
      fieldErrors: formatted.fieldErrors,
      formErrors: formatted.formErrors,
    },
    { status: 400 },
  );
}
