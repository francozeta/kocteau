"use client";

import { toast } from "sonner";
import { getErrorMessage } from "@/lib/validation/errors";

export function toastActionError(error: unknown, fallback: string) {
  toast.error(getErrorMessage(error, fallback));
}

export function toastActionSuccess(message: string, description?: string) {
  toast.success(message, description ? { description } : undefined);
}
