"use client";

import { useEffect } from "react";

export const OPEN_NEW_REVIEW_SHORTCUT_EVENT = "kocteau:new-review-open";
export const OPEN_SEARCH_LAUNCHER_SHORTCUT_EVENT = "kocteau:search-launcher-open";

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

      if (key === "n") {
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
