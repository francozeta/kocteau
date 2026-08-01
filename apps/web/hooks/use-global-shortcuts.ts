"use client";

import { useEffect } from "react";

export const OPEN_NEW_REVIEW_SHORTCUT_EVENT = "kocteau:new-review-open";
export const OPEN_SEARCH_LAUNCHER_SHORTCUT_EVENT = "kocteau:search-launcher-open";

export type ReviewComposerSelection = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  entity_id?: string | null;
};

export function openTrackReviewComposer(selection: ReviewComposerSelection) {
  window.dispatchEvent(
    new CustomEvent<ReviewComposerSelection>(OPEN_NEW_REVIEW_SHORTCUT_EVENT, {
      detail: selection,
    }),
  );
}

function shouldIgnoreGlobalShortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat) {
    return true;
  }

  if (event.altKey) {
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
  useEffect(() => {
    function handleOpenCompose() {
      window.dispatchEvent(new CustomEvent(OPEN_NEW_REVIEW_SHORTCUT_EVENT));
    }

    function handleOpenSearchLauncher() {
      window.dispatchEvent(new CustomEvent(OPEN_SEARCH_LAUNCHER_SHORTCUT_EVENT));
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (shouldIgnoreGlobalShortcut(event)) {
        return;
      }

      const key = event.key.toLowerCase();
      const isCommandPaletteShortcut =
        key === "k" && (event.metaKey || event.ctrlKey) && !event.shiftKey;

      if (isCommandPaletteShortcut) {
        event.preventDefault();
        handleOpenSearchLauncher();
        return;
      }

      if (event.metaKey || event.ctrlKey) {
        return;
      }

      if (key === "/") {
        event.preventDefault();
        handleOpenSearchLauncher();
        return;
      }

      if (key === "c") {
        event.preventDefault();
        handleOpenCompose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
