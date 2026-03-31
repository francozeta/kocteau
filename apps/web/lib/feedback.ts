"use client";

import { toast } from "sonner";
import { getErrorMessage } from "@/lib/validation/errors";

type AuthPromptAction = "comment" | "like" | "bookmark" | "create-review";

const authPromptCopy: Record<
  AuthPromptAction,
  { title: string; description: string }
> = {
  comment: {
    title: "Log in to comment",
    description: "Join the conversation and leave your own take.",
  },
  like: {
    title: "Log in to like reviews",
    description: "Save your reactions and make your taste visible.",
  },
  bookmark: {
    title: "Log in to save reviews",
    description: "Keep great takes close and build your own library.",
  },
  "create-review": {
    title: "Log in to create a review",
    description: "Publish notes, ratings, and recommendations on Kocteau.",
  },
};

export function toastActionError(error: unknown, fallback: string) {
  toast.error(getErrorMessage(error, fallback));
}

export function toastActionSuccess(message: string, description?: string) {
  toast.success(message, description ? { description } : undefined);
}

export function toastAuthRequired(action: AuthPromptAction) {
  const copy = authPromptCopy[action];

  toast(copy.title, {
    id: `auth-required:${action}`,
    description: copy.description,
    className:
      "border-border/30 bg-popover/96 text-popover-foreground shadow-xl backdrop-blur-xl",
    descriptionClassName: "text-muted-foreground",
    action: {
      label: "Log in",
      onClick: () => {
        if (typeof window !== "undefined") {
          window.location.assign("/login");
        }
      },
    },
  });
}
