"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";
import {
  OPEN_NEW_REVIEW_SHORTCUT_EVENT,
  OPEN_SEARCH_LAUNCHER_SHORTCUT_EVENT,
  type ReviewComposerSelection,
} from "@/hooks/use-global-shortcuts";

const NewReviewDialog = dynamic(() => import("@/components/new-review-dialog"), {
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
      router.push("/search");
    }

    window.addEventListener(OPEN_NEW_REVIEW_SHORTCUT_EVENT, handleOpenReview);
    window.addEventListener(OPEN_SEARCH_LAUNCHER_SHORTCUT_EVENT, handleOpenSearch);

    return () => {
      window.removeEventListener(OPEN_NEW_REVIEW_SHORTCUT_EVENT, handleOpenReview);
      window.removeEventListener(OPEN_SEARCH_LAUNCHER_SHORTCUT_EVENT, handleOpenSearch);
    };
  }, [router]);

  return reviewComposerMounted ? (
    <>
      <NewReviewDialog
        isAuthenticated={isAuthenticated}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        showTrigger={false}
        initialSelection={reviewSelection}
      />
    </>
  ) : null;
}
