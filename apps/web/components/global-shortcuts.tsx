"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NewReviewDialog from "@/components/new-review-dialog";
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";
import {
  OPEN_NEW_REVIEW_SHORTCUT_EVENT,
  OPEN_SEARCH_LAUNCHER_SHORTCUT_EVENT,
} from "@/hooks/use-global-shortcuts";

export default function GlobalShortcuts({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const router = useRouter();
  useGlobalShortcuts();

  useEffect(() => {
    function handleOpenReview() {
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

  return (
    <>
      <NewReviewDialog
        isAuthenticated={isAuthenticated}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        showTrigger={false}
      />
    </>
  );
}
