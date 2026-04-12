"use client";

import { useEffect, useState } from "react";
import NewReviewDialog from "@/components/new-review-dialog";
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";
import { OPEN_NEW_REVIEW_SHORTCUT_EVENT } from "@/hooks/use-global-shortcuts";

export default function GlobalShortcuts() {
  const [open, setOpen] = useState(false);
  useGlobalShortcuts();

  useEffect(() => {
    function handleOpenReview() {
      setOpen(true);
    }

    window.addEventListener(OPEN_NEW_REVIEW_SHORTCUT_EVENT, handleOpenReview);

    return () => {
      window.removeEventListener(OPEN_NEW_REVIEW_SHORTCUT_EVENT, handleOpenReview);
    };
  }, []);

  return (
    <NewReviewDialog
      isAuthenticated
      open={open}
      onOpenChange={setOpen}
      showTrigger={false}
    />
  );
}
