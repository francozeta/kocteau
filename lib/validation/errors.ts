import { z } from "zod";

export type ValidationFieldErrors = Record<string, string[] | undefined>;

export type ApiErrorPayload = {
  error?: string;
  code?: string | null;
  fieldErrors?: ValidationFieldErrors;
  formErrors?: string[];
  [key: string]: unknown;
};

export class ApiError extends Error {
  code?: string | null;
  fieldErrors?: ValidationFieldErrors;
  formErrors?: string[];
  status?: number;
  payload?: ApiErrorPayload;

  constructor({
    message,
    code,
    fieldErrors,
    formErrors,
    status,
    payload,
  }: {
    message: string;
    code?: string | null;
    fieldErrors?: ValidationFieldErrors;
    formErrors?: string[];
    status?: number;
    payload?: ApiErrorPayload;
  }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.formErrors = formErrors;
    this.status = status;
    this.payload = payload;
  }
}

export function formatZodError(error: z.ZodError) {
  const flattened = z.flattenError(error);

  return {
    fieldErrors: flattened.fieldErrors,
    formErrors: flattened.formErrors,
    message: flattened.formErrors[0] ?? "Please review the highlighted fields.",
  };
}

export function getFirstFieldError(
  fieldErrors: ValidationFieldErrors | undefined,
  field: string,
) {
  return fieldErrors?.[field]?.[0] ?? null;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function createApiError(
  response: Response,
  fallback: string,
) {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

  return new ApiError({
    message: payload?.error ?? fallback,
    code: payload?.code ?? null,
    fieldErrors: payload?.fieldErrors,
    formErrors: payload?.formErrors,
    status: response.status,
    payload: payload ?? undefined,
  });
}
