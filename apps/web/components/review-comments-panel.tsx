"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Flag, MoreHorizontal, Send, Trash2 } from "@/components/ui/icons";
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
  viewer?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  variant?: "dialog" | "inline";
  hideForm?: boolean;
  autoFocusComposer?: boolean;
  replyTarget?: string | null;
  anchorId?: string;
  composerId?: string;
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
  viewer = null,
  variant = "dialog",
  hideForm = false,
  autoFocusComposer = false,
  replyTarget = null,
  anchorId,
  composerId,
}: ReviewCommentsPanelProps) {
  const [body, setBody] = useState("");
  const [composerIsMultiline, setComposerIsMultiline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const composerBaseHeightRef = useRef<number | null>(null);
  const {
    comments,
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
    viewer: viewer
      ? {
          id: viewer.id,
          username: viewer.username,
          displayName: viewer.display_name,
          avatarUrl: viewer.avatar_url,
        }
      : undefined,
  });

  const trimmedBody = useMemo(() => body.trim(), [body]);
  const isInline = variant === "inline";
  const shouldReduceMotion = useReducedMotion();
  const replyPlaceholder = replyTarget ? `Reply to @${replyTarget}...` : "Reply to this review...";

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

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const node = textareaRef.current;

    if (!node) {
      return;
    }

    const syncComposerShape = () => {
      if (!body) {
        composerBaseHeightRef.current = node.scrollHeight;
        setComposerIsMultiline(false);
        return;
      }

      const baseline = composerBaseHeightRef.current ?? node.scrollHeight;
      setComposerIsMultiline(node.scrollHeight > baseline + 4);
    };

    syncComposerShape();

    const observer = new ResizeObserver(syncComposerShape);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [body, isAuthenticated]);

  async function handleSubmit() {
    if (!trimmedBody) {
      return;
    }

    const submittedBody = trimmedBody;
    setBody("");

    try {
      await createComment(submittedBody);
    } catch (error) {
      setBody(submittedBody);
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
    <div className="space-y-0">
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="size-4 text-muted-foreground/70" />
        </div>
      ) : isError ? (
        <div className={cn(
          "border-t border-border/24 text-sm text-muted-foreground",
          isInline ? "px-1 py-4" : "px-4 py-5",
        )}>
          Comments are temporarily unavailable.
        </div>
      ) : comments.length > 0 ? (
        comments.map((comment) => {
          const author = comment.author;
          const authorLabel = author?.display_name ?? (author ? `@${author.username}` : "You");

          return (
            <div
              key={comment.id}
              id={`comment-${comment.id}`}
              className={cn(
                "border-t border-border/24 transition-opacity",
                isInline ? "px-1 py-4" : "px-4 py-4",
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
                    {author?.username ? (
                      <Link
                        href={`/u/${author.username}`}
                        className="block truncate text-sm font-medium text-foreground transition-colors hover:text-foreground/82 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                      >
                        {authorLabel}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium text-foreground">
                        {authorLabel}
                      </p>
                    )}
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
                    className="w-40 min-w-40 rounded-xl border-border/42 bg-popover/98 p-1.5 shadow-none md:border-border/30 md:bg-popover/96"
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
        <div className={cn(
          "text-sm text-muted-foreground",
          isInline
            ? "px-1 py-4"
            : "border-t border-border/24 px-4 py-5",
        )}>
          <p className="font-medium text-foreground/86">No replies yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Be the first to respond to this review.</p>
        </div>
      )}
    </div>
  );

  const form = isAuthenticated ? (
    <motion.div
      animate={{
        borderRadius: composerIsMultiline ? 18 : 999,
        scale: composerIsMultiline && !shouldReduceMotion ? 1.004 : 1,
      }}
      className={cn(
        "flex items-end gap-2 border border-border/42 bg-muted/58 px-2 py-2 transition-[background-color,border-color,box-shadow] duration-100 ease-out focus-within:border-white/32 focus-within:bg-muted/72 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_0_0_4px_rgba(255,255,255,0.035)] md:border-border/34 md:bg-muted/48 md:focus-within:border-white/34",
        !isInline && "w-full",
      )}
      initial={false}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring", duration: 0.18, bounce: 0 }
      }
    >
      <UserAvatar
        avatarUrl={viewer?.avatar_url}
        displayName={viewer?.display_name ?? null}
        username={viewer?.username ?? null}
        className="size-8"
        fallbackClassName="text-[11px]"
      />
      <Textarea
        id={composerId}
        ref={textareaRef}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
            return;
          }

          event.preventDefault();
          void handleSubmit();
        }}
        placeholder={replyPlaceholder}
        className="max-h-28 min-h-8 flex-1 border-0 bg-transparent px-0 py-1.5 text-[13px] leading-5 shadow-none placeholder:text-muted-foreground/82 focus-visible:border-transparent focus-visible:ring-0"
        maxLength={1000}
        rows={1}
      />
      <Button
        type="button"
        size="icon"
        onClick={handleSubmit}
        disabled={!trimmedBody || isPosting}
        className="size-8 shrink-0 rounded-full"
        aria-label="Post comment"
      >
        {isPosting ? <Spinner className="size-3.5" /> : <Send className="size-3.5" />}
      </Button>
    </motion.div>
  ) : (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        isInline && "rounded-full border border-border/42 bg-muted/58 px-3 py-2 md:border-border/34 md:bg-muted/48",
      )}
    >
      <div className={cn("space-y-1", isInline && "min-w-0")}>
        <p className={cn("text-sm font-medium text-foreground", isInline && "truncate text-[13px]")}>
          Log in to reply
        </p>
        {!isInline ? (
          <p className="text-xs text-muted-foreground">
            You can read comments already, but posting requires an account.
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Link href={`/login?next=${encodeURIComponent(`/review/${reviewId}`)}`}>
          <Button size="sm" className={cn(isInline && "h-8 rounded-full px-4")}>Log in</Button>
        </Link>
        {!isInline ? (
          <Link href="/signup">
          <Button size="sm" variant="outline">
            Create account
          </Button>
          </Link>
        ) : null}
      </div>
    </div>
  );

  if (isInline) {
    return (
      <section
        id={anchorId}
        aria-label="Review replies"
        className="space-y-3 px-1"
      >
        {!hideForm ? form : null}
        {commentsList}
      </section>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        {commentsList}
      </ScrollArea>

      <div className="border-t border-border/30 px-3 py-3 md:border-border/24">
        {!hideForm ? form : null}
      </div>
    </div>
  );
}
