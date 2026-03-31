"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/user-avatar";
import { useReviewComments } from "@/hooks/use-review-comments";
import { toastActionError } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type ReviewCommentsPanelProps = {
  reviewId: string;
  initialCount: number;
  isAuthenticated: boolean;
  variant?: "dialog" | "inline";
  hideForm?: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

export default function ReviewCommentsPanel({
  reviewId,
  initialCount,
  isAuthenticated,
  variant = "dialog",
  hideForm = false,
}: ReviewCommentsPanelProps) {
  const [body, setBody] = useState("");
  const {
    comments,
    commentsCount,
    isLoading,
    isError,
    createComment,
    isPosting,
    deleteComment,
    isDeleting,
  } = useReviewComments({
    reviewId,
    initialCount,
    enabled: true,
  });

  const trimmedBody = useMemo(() => body.trim(), [body]);
  const isInline = variant === "inline";

  async function handleSubmit() {
    if (!trimmedBody) {
      return;
    }

    try {
      await createComment(trimmedBody);
      setBody("");
    } catch (error) {
      toastActionError(error, "We couldn't post your comment right now.");
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(commentId);
    } catch (error) {
      toastActionError(error, "We couldn't delete your comment right now.");
    }
  }

  const commentsList = (
    <div className={cn("space-y-4", isInline ? "py-0" : "py-5")}>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading comments...</div>
      ) : isError ? (
        <div className="rounded-xl border border-border/30 bg-card/40 p-4 text-sm text-muted-foreground">
          Comments are temporarily unavailable.
        </div>
      ) : comments.length > 0 ? (
        comments.map((comment) => {
          const author = Array.isArray(comment.author)
            ? comment.author[0] ?? null
            : comment.author;
          const authorLabel = author?.display_name ?? (author ? `@${author.username}` : "You");

          return (
            <div
              key={comment.id}
              className={cn(
                "rounded-xl border border-border/30 bg-card/40 p-4 transition-opacity",
                comment.optimistic && "opacity-70",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    avatarUrl={author?.avatar_url}
                    displayName={author?.display_name ?? null}
                    username={author?.username ?? null}
                    className="size-8"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {authorLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {comment.optimistic ? "Posting..." : formatDate(comment.created_at)}
                    </p>
                  </div>
                </div>

                {comment.is_owner ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    disabled={comment.optimistic || isDeleting}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                ) : null}
              </div>

              <p className="mt-3 text-sm leading-6 text-foreground/85">{comment.body}</p>
            </div>
          );
        })
      ) : (
        <div className="rounded-xl border border-dashed border-border/40 bg-card/30 p-6 text-sm text-muted-foreground">
          No comments yet. Start the conversation around this review.
        </div>
      )}
    </div>
  );

  const form = isAuthenticated ? (
    <div className="space-y-3">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Add a short comment..."
        className="min-h-24"
        maxLength={1000}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
        </p>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!trimmedBody || isPosting}
          className="gap-2"
        >
          <Send className="size-3.5" />
          {isPosting ? "Posting..." : "Post comment"}
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Sign in to comment</p>
        <p className="text-xs text-muted-foreground">
          You can read comments already, but posting requires an account.
        </p>
      </div>
      <div className="flex gap-2">
        <Link href="/login">
          <Button size="sm">Log in</Button>
        </Link>
        <Link href="/signup">
          <Button size="sm" variant="outline">
            Create account
          </Button>
        </Link>
      </div>
    </div>
  );

  if (isInline) {
    return (
      <div className="space-y-5">
        {commentsList}
        {!hideForm ? <div className="border-t border-border/20 pt-4">{form}</div> : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1 px-6">
        {commentsList}
      </ScrollArea>

      <div className="border-t border-border/30 px-6 py-4">
        {!hideForm ? form : null}
      </div>
    </div>
  );
}
