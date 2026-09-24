"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

const serverSnapshot = () => null;

export function usePortalTarget(selector: string) {
  return useSyncExternalStore(
    subscribe,
    () => document.querySelector<HTMLElement>(selector),
    serverSnapshot,
  );
}
