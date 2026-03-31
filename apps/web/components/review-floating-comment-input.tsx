"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReviewComments } from "@/hooks/use-review-comments";
import { toastActionError, toastAuthRequired } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type ReviewFloatingCommentInputProps = {
  reviewId: string;
  initialCount: number;
  isAuthenticated: boolean;
  replyTarget: string;
};

export default function ReviewFloatingCommentInput({
  reviewId,
  initialCount,
  isAuthenticated,
  replyTarget,
}: ReviewFloatingCommentInputProps) {
  const [body, setBody] = useState("");
  const { createComment, isPosting } = useReviewComments({
    reviewId,
    initialCount,
    enabled: false,
  });

  const trimmedBody = useMemo(() => body.trim(), [body]);

  async function submitComment() {
    if (!isAuthenticated) {
      toastAuthRequired("comment");
      return;
    }

    if (!trimmedBody || isPosting) {
      return;
    }

    try {
      await createComment(trimmedBody);
      setBody("");
    } catch (error) {
      toastActionError(error, "We couldn't post your comment right now.");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    void submitComment();
  }

  function handleUnauthenticatedIntent() {
    if (!isAuthenticated) {
      toastAuthRequired("comment");
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-3 md:hidden">
      <div className="mx-auto max-w-[30rem]">
        <div className="flex items-center gap-2 rounded-[1.5rem] border border-border/22 bg-background/90 px-2.5 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <Input
            value={body}
            onChange={(event) => {
              if (!isAuthenticated) {
                return;
              }

              setBody(event.target.value);
            }}
            onKeyDown={handleKeyDown}
            onFocus={handleUnauthenticatedIntent}
            onClick={handleUnauthenticatedIntent}
            readOnly={!isAuthenticated}
            maxLength={1000}
            placeholder={`Reply to ${replyTarget}`}
            className="h-11 rounded-[1.1rem] border-transparent bg-transparent px-3 text-sm text-foreground shadow-none focus-visible:border-border/20 focus-visible:bg-muted/10 focus-visible:ring-0"
          />

          <Button
            type="button"
            size="icon"
            onClick={() => {
              void submitComment();
            }}
            disabled={isAuthenticated ? !trimmedBody || isPosting : false}
            aria-label="Send comment"
            className={cn(
              "size-10 shrink-0 rounded-[1rem] bg-foreground text-background shadow-none hover:bg-foreground/92",
              !isAuthenticated && "opacity-100",
            )}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
