"use client";

import { startTransition, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type UseGlobalShortcutsOptions = {
  profileUsername?: string | null;
};

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

export function useGlobalShortcuts({ profileUsername = null }: UseGlobalShortcutsOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chordTimeoutRef = useRef<number | null>(null);
  const pendingChordRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (chordTimeoutRef.current) {
        window.clearTimeout(chordTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function resetChord() {
      pendingChordRef.current = null;

      if (chordTimeoutRef.current) {
        window.clearTimeout(chordTimeoutRef.current);
        chordTimeoutRef.current = null;
      }
    }

    function handleOpenCompose() {
      const next = new URLSearchParams(searchParams.toString());
      next.set("compose", "1");

      startTransition(() => {
        router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, {
          scroll: false,
        });
      });
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
        resetChord();
        return;
      }

      const key = event.key.toLowerCase();

      if (pendingChordRef.current === "g") {
        if (key === "h") {
          event.preventDefault();
          resetChord();
          router.prefetch("/");
          router.push("/");
          return;
        }

        if (key === "p" && profileUsername) {
          event.preventDefault();
          resetChord();
          router.prefetch(`/u/${profileUsername}`);
          router.push(`/u/${profileUsername}`);
          return;
        }

        resetChord();
      }

      if (key === "g") {
        pendingChordRef.current = "g";

        if (chordTimeoutRef.current) {
          window.clearTimeout(chordTimeoutRef.current);
        }

        chordTimeoutRef.current = window.setTimeout(() => {
          pendingChordRef.current = null;
          chordTimeoutRef.current = null;
        }, 900);

        return;
      }

      if (key === "n") {
        event.preventDefault();
        handleOpenCompose();
        resetChord();
        return;
      }

      if (key === "f") {
        event.preventDefault();
        handleFocusSearch();
        resetChord();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname, profileUsername, router, searchParams]);
}
