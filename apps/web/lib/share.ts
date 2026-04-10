"use client";

import { toastActionError, toastActionSuccess } from "@/lib/feedback";

type ShareUrlOptions = {
  title: string;
  url: string;
  successMessage: string;
  errorMessage: string;
};

export async function shareUrl({
  title,
  url,
  successMessage,
  errorMessage,
}: ShareUrlOptions) {
  try {
    if (typeof window === "undefined") {
      return;
    }

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: title,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      toastActionSuccess(successMessage);
      return;
    }

    throw new Error("Sharing is unavailable on this device right now.");
  } catch (error) {
    toastActionError(error, errorMessage);
  }
}
