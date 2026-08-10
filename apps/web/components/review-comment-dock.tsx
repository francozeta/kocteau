"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import { KocteauCommentIcon } from "@/components/kocteau-icons";
import { Input } from "@/components/ui/input";
import { Send, XIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import UserAvatar from "@/components/user-avatar";
import { useReviewComments } from "@/hooks/use-review-comments";
import { toastActionError } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type ReviewCommentDockProps = {
  reviewId: string;
  initialCount: number;
  returnPath: string;
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function ReviewCommentDock({
  reviewId,
  initialCount,
  returnPath,
  profile,
}: ReviewCommentDockProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [body, setBody] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const trimmedBody = useMemo(() => body.trim(), [body]);
  const { createComment, isPosting } = useReviewComments({
    reviewId,
    initialCount,
    viewer: profile
      ? {
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
        }
      : undefined,
  });

  async function handleSubmit() {
    if (!trimmedBody || isPosting || !profile) {
      return;
    }

    const submittedBody = trimmedBody;
    setBody("");

    try {
      await createComment(submittedBody);
      inputRef.current?.blur();
      setIsFocused(false);
    } catch (error) {
      setBody(submittedBody);
      toastActionError(error, "We couldn't post your comment right now.");
    }
  }

  if (!profile) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(returnPath)}`}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-foreground backdrop-blur-2xl backdrop-saturate-150 transition-[transform,background-color] duration-150 hover:bg-white/[0.12] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
      >
        <KocteauCommentIcon className="size-4" />
        Log in to comment
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "grid items-center transition-[grid-template-columns,gap] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
        isFocused
          ? "grid-cols-[minmax(0,1fr)_2.75rem] gap-3"
          : "grid-cols-[minmax(0,1fr)_0fr] gap-0",
      )}
    >
      <form
        className="relative min-w-0"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Add a comment to this review
        </label>
        <UserAvatar
          avatarUrl={profile.avatar_url}
          displayName={profile.display_name}
          username={profile.username}
          className="pointer-events-none absolute left-2 top-1/2 z-10 size-7 -translate-y-1/2"
          sizes="28px"
        />
        <Input
          ref={inputRef}
          id={inputId}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              inputRef.current?.blur();
              setIsFocused(false);
            }
          }}
          placeholder="Add a comment…"
          autoComplete="off"
          maxLength={1000}
          className="h-11 rounded-full border-transparent bg-white/[0.08] pl-11 pr-12 text-base shadow-none placeholder:text-muted-foreground/58 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring/70"
        />
        {trimmedBody ? (
          <button
            type="submit"
            disabled={isPosting}
            aria-label="Post comment"
            className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.14] text-foreground transition-[transform,background-color,opacity] duration-150 hover:bg-white/[0.2] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:pointer-events-none disabled:opacity-60"
          >
            {isPosting ? <Spinner className="size-4" /> : <Send className="size-4" />}
          </button>
        ) : null}
      </form>

      <div className="overflow-hidden">
        <button
          type="button"
          aria-label="Close comment input"
          aria-hidden={!isFocused}
          tabIndex={isFocused ? 0 : -1}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            inputRef.current?.blur();
            setIsFocused(false);
          }}
          className={cn(
            "flex size-11 items-center justify-center rounded-full bg-white/[0.08] text-foreground transition-[opacity,scale,background-color] duration-150 hover:bg-white/[0.12] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
            isFocused
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-95 opacity-0",
          )}
        >
          <XIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}
