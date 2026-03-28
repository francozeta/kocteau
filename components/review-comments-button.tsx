"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/user-avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReviewComments } from "@/hooks/use-review-comments";
import { toastActionError } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type ReviewCommentsButtonProps = {
  reviewId: string;
  initialCount: number;
  isAuthenticated: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

export default function ReviewCommentsButton({
  reviewId,
  initialCount,
  isAuthenticated,
}: ReviewCommentsButtonProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
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
    enabled: open,
  });

  const trimmedBody = useMemo(() => body.trim(), [body]);

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

  const commentsBody = (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1 px-6">
        <div className="space-y-4 py-5">
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
      </ScrollArea>

      <div className="border-t border-border/30 px-6 py-4">
        {isAuthenticated ? (
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
                Keep it thoughtful and concise.
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
        )}
      </div>
    </div>
  );

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open comments"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-border/40 hover:bg-muted/40 hover:text-foreground active:scale-[0.98]",
        open && "text-foreground",
      )}
    >
      <MessageCircle className="size-4" />
      <span>{commentsCount}</span>
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="flex h-[88vh] max-h-[88vh] flex-col border-border/30">
            <DrawerHeader className="border-b border-border/30 text-left">
              <DrawerTitle>Comments</DrawerTitle>
              <DrawerDescription>
                {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
              </DrawerDescription>
            </DrawerHeader>
            {commentsBody}
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[min(82vh,42rem)] max-w-2xl flex-col overflow-hidden border-border/30 p-0">
          <DialogHeader className="border-b border-border/30 px-6 py-4">
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
            </DialogDescription>
          </DialogHeader>
          {commentsBody}
        </DialogContent>
      </Dialog>
    </>
  );
}
