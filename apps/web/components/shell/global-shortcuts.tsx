"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  OPEN_NEW_REVIEW_SHORTCUT_EVENT,
  OPEN_SEARCH_LAUNCHER_SHORTCUT_EVENT,
  useGlobalShortcuts,
  type ReviewComposerSelection,
} from "@/hooks/use-global-shortcuts";

const NewReviewDialog = dynamic(() => import("@/components/reviews/new-review-dialog"), {
  ssr: false,
});

export default function GlobalShortcuts({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewComposerMounted, setReviewComposerMounted] = useState(false);
  const [reviewSelection, setReviewSelection] =
    useState<ReviewComposerSelection | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const composeFromUrl = searchParams.get("compose") === "1";
  useGlobalShortcuts();

  useEffect(() => {
    function handleOpenReview(event: Event) {
      setReviewSelection(
        event instanceof CustomEvent && event.detail ? event.detail : null,
      );
      setReviewComposerMounted(true);
      setReviewOpen(true);
    }

    function handleOpenSearch() {
      const input = document.querySelector<HTMLInputElement>("[data-global-search-input]");
      if (input) {
        input.focus();
        return;
      }
      const trigger = document.querySelector<HTMLButtonElement>("[data-global-search-trigger]");
      if (trigger) {
        trigger.click();
        return;
      }
      router.push("/search");
    }

    window.addEventListener(OPEN_NEW_REVIEW_SHORTCUT_EVENT, handleOpenReview);
    window.addEventListener(OPEN_SEARCH_LAUNCHER_SHORTCUT_EVENT, handleOpenSearch);

    return () => {
      window.removeEventListener(OPEN_NEW_REVIEW_SHORTCUT_EVENT, handleOpenReview);
      window.removeEventListener(OPEN_SEARCH_LAUNCHER_SHORTCUT_EVENT, handleOpenSearch);
    };
  }, [router]);

  return reviewComposerMounted || composeFromUrl ? (
    <NewReviewDialog
      isAuthenticated={isAuthenticated}
      open={reviewOpen}
      onOpenChange={setReviewOpen}
      showTrigger={false}
      initialSelection={reviewSelection ?? undefined}
    />
  ) : null;
}
