"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Flag, MoreHorizontal, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/user-avatar";
import { useReviewComments } from "@/hooks/use-review-comments";
import { toastActionError, toastActionSuccess } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type ReviewCommentsPanelProps = {
  reviewId: string;
  initialCount: number;
  isAuthenticated: boolean;
  variant?: "dialog" | "inline";
  hideForm?: boolean;
  autoFocusComposer?: boolean;
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
  autoFocusComposer = false,
}: ReviewCommentsPanelProps) {
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
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

  useEffect(() => {
    if (!autoFocusComposer || hideForm || !isAuthenticated) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const end = textareaRef.current?.value.length ?? 0;
      textareaRef.current?.setSelectionRange(end, end);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [autoFocusComposer, hideForm, isAuthenticated]);

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

  async function handleReport(commentId: string) {
    try {
      if (typeof window !== "undefined") {
        const reportUrl = new URL(window.location.href);
        reportUrl.hash = `comment-${commentId}`;

        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(reportUrl.toString());
          toastActionSuccess("Comment link copied. Reporting tools are coming soon.");
          return;
        }
      }

      toastActionSuccess("Reporting tools are coming soon.");
    } catch (error) {
      toastActionError(error, "We couldn't prepare this report right now.");
    }
  }

  const commentsList = (
    <div className={cn("space-y-4", isInline ? "py-0" : "py-5")}>
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="size-4 text-muted-foreground/70" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border/40 bg-card/46 p-4 text-sm text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/30 md:bg-card/40">
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
              id={`comment-${comment.id}`}
              className={cn(
                "rounded-xl border border-border/40 bg-card/46 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-opacity md:border-border/30 md:bg-card/40",
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={comment.optimistic}
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground disabled:pointer-events-none disabled:opacity-50 md:hover:bg-muted"
                      aria-label="Comment options"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-40 min-w-40 rounded-xl border-border/42 bg-popover/98 p-1.5 shadow-xl shadow-black/30 md:border-border/30 md:bg-popover/96"
                    sideOffset={8}
                  >
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        void handleReport(comment.id);
                      }}
                    >
                      <Flag className="size-4" />
                      Report comment
                    </DropdownMenuItem>
                    {comment.is_owner ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={isDeleting}
                          onSelect={(event) => {
                            event.preventDefault();
                            void handleDelete(comment.id);
                          }}
                        >
                          <Trash2 className="size-4" />
                          Delete comment
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="mt-3 max-w-full whitespace-pre-wrap text-sm leading-6 text-foreground/85 [overflow-wrap:anywhere]">
                {comment.body}
              </p>
            </div>
          );
        })
      ) : (
        <div className="rounded-xl border border-dashed border-border/48 bg-card/36 p-6 text-sm text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] md:border-border/40 md:bg-card/30">
          No comments yet. Start the conversation around this review.
        </div>
      )}
    </div>
  );

  const form = isAuthenticated ? (
    <div className="space-y-3">
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Add a short comment..."
        className={cn("min-h-24", !isInline && "min-h-28")}
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
        {!hideForm ? <div className="border-t border-border/28 pt-4 md:border-border/20">{form}</div> : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1 px-4">
        {commentsList}
      </ScrollArea>

      <div className="border-t border-border/36 px-4 py-4 md:border-border/30">
        {!hideForm ? form : null}
      </div>
    </div>
  );
}
