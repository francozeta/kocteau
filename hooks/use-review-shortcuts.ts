"use client";

import { useCallback, useEffect, useState, type KeyboardEvent as ReactKeyboardEvent, type FocusEvent as ReactFocusEvent } from "react";

type UseReviewShortcutsOptions = {
  enabled?: boolean;
  canManage?: boolean;
  canOpenTrack?: boolean;
  likeButtonRef: React.RefObject<HTMLButtonElement | null>;
  bookmarkButtonRef: React.RefObject<HTMLButtonElement | null>;
  onOpenReview: () => void;
  onOpenTrack?: () => void;
  onEditReview?: () => void;
  onCopyReviewLink?: () => void | Promise<void>;
  onRequestDelete?: () => void;
  onReportReview?: () => void | Promise<void>;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      "input,textarea,select,[contenteditable='true'],[role='textbox'],[data-slot='dropdown-menu-content'],[data-slot='context-menu-content'],[data-slot='dialog-content'],[data-slot='drawer-content']",
    ),
  );
}

export function useReviewShortcuts({
  enabled = true,
  canManage = false,
  canOpenTrack = false,
  likeButtonRef,
  bookmarkButtonRef,
  onOpenReview,
  onOpenTrack,
  onEditReview,
  onCopyReviewLink,
  onRequestDelete,
  onReportReview,
}: UseReviewShortcutsOptions) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const isActive = isHovered || isFocusedWithin;

  const runShortcut = useCallback((event: KeyboardEvent | ReactKeyboardEvent<HTMLElement>) => {
    if (!enabled || event.defaultPrevented || event.repeat) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (isTypingTarget(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();

    if (event.shiftKey && key === "l") {
      event.preventDefault();
      void onCopyReviewLink?.();
      return;
    }

    if (key === "l") {
      event.preventDefault();
      likeButtonRef.current?.click();
      return;
    }

    if (key === "b") {
      event.preventDefault();
      bookmarkButtonRef.current?.click();
      return;
    }

    if (key === "o") {
      event.preventDefault();
      onOpenReview();
      return;
    }

    if (key === "t" && canOpenTrack) {
      event.preventDefault();
      onOpenTrack?.();
      return;
    }

    if (key === "e" && canManage) {
      event.preventDefault();
      onEditReview?.();
      return;
    }

    if (key === "r" && !canManage) {
      event.preventDefault();
      void onReportReview?.();
      return;
    }

    if (event.key === "Delete" && canManage) {
      event.preventDefault();
      onRequestDelete?.();
    }
  }, [enabled, canManage, canOpenTrack, likeButtonRef, bookmarkButtonRef, onOpenReview, onOpenTrack, onEditReview, onCopyReviewLink, onRequestDelete, onReportReview]);

  useEffect(() => {
    if (!enabled || !isActive) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      runShortcut(event);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, isActive, runShortcut]);

  function handleMouseEnter() {
    setIsHovered(true);
  }

  function handleMouseLeave() {
    setIsHovered(false);
  }

  function handleFocusCapture() {
    setIsFocusedWithin(true);
  }

  function handleBlurCapture(event: ReactFocusEvent<HTMLElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsFocusedWithin(false);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    runShortcut(event);
  }

  return {
    isActive,
    handleMouseEnter,
    handleMouseLeave,
    handleFocusCapture,
    handleBlurCapture,
    handleKeyDown,
  };
}
