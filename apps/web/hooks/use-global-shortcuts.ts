"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export const OPEN_NEW_REVIEW_SHORTCUT_EVENT = "kocteau:new-review-open";

function shouldIgnoreGlobalShortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat) {
    return true;
  }

  if (event.metaKey || event.ctrlKey || event.altKey) {
    return true;
  }

  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      "input,textarea,select,[contenteditable='true'],[role='textbox'],[data-slot='dropdown-menu-content'],[data-slot='context-menu-content'],[data-slot='dialog-content'],[data-slot='drawer-content']",
    ),
  );
}

export function useGlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleOpenCompose() {
      window.dispatchEvent(new CustomEvent(OPEN_NEW_REVIEW_SHORTCUT_EVENT));
    }

    function handleFocusSearch() {
      const searchInput = document.querySelector<HTMLInputElement>("[data-global-search-input='true']");

      if (searchInput) {
        searchInput.focus();
        searchInput.select();
        return;
      }

      router.prefetch("/search");
      router.push("/search");
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (shouldIgnoreGlobalShortcut(event)) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "n") {
        event.preventDefault();
        handleOpenCompose();
        return;
      }

      if (key === "f") {
        event.preventDefault();
        handleFocusSearch();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname, router]);
}
