"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type KeyboardAwareDrawerMetrics = {
  visualHeight: number | null;
  keyboardOffset: number;
};

type KeyboardAwareDrawerStyle = CSSProperties & {
  "--review-drawer-visual-height": string;
  "--review-drawer-keyboard-offset": string;
  "--review-drawer-height": string;
};

function isEditableElement(element: Element | null) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  return (
    element.matches("input, textarea, select") ||
    element.isContentEditable
  );
}

function getViewportMetrics(): KeyboardAwareDrawerMetrics {
  const viewport = window.visualViewport;

  if (!viewport) {
    return {
      visualHeight: window.innerHeight,
      keyboardOffset: 0,
    };
  }

  const activeElement = document.activeElement;
  const viewportDelta = window.innerHeight - viewport.height;
  const keyboardLikelyOpen = isEditableElement(activeElement) && viewportDelta > 96;
  const keyboardOffset = keyboardLikelyOpen
    ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
    : 0;

  return {
    visualHeight: viewport.height,
    keyboardOffset,
  };
}

export function useKeyboardAwareDrawerStyle(enabled: boolean): KeyboardAwareDrawerStyle {
  const [metrics, setMetrics] = useState<KeyboardAwareDrawerMetrics>({
    visualHeight: null,
    keyboardOffset: 0,
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const viewport = window.visualViewport;
    let frame = 0;

    function scheduleMeasure() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const nextMetrics = getViewportMetrics();

        setMetrics((current) => {
          const visualHeightChanged =
            Math.abs((current.visualHeight ?? 0) - (nextMetrics.visualHeight ?? 0)) > 0.5;
          const keyboardOffsetChanged =
            Math.abs(current.keyboardOffset - nextMetrics.keyboardOffset) > 0.5;

          return visualHeightChanged || keyboardOffsetChanged
            ? nextMetrics
            : current;
        });
      });
    }

    scheduleMeasure();

    viewport?.addEventListener("resize", scheduleMeasure, { passive: true });
    viewport?.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    document.addEventListener("focusin", scheduleMeasure);
    document.addEventListener("focusout", scheduleMeasure);

    return () => {
      window.cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", scheduleMeasure);
      viewport?.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      document.removeEventListener("focusin", scheduleMeasure);
      document.removeEventListener("focusout", scheduleMeasure);
    };
  }, [enabled]);

  return useMemo(
    () => ({
      "--review-drawer-visual-height": enabled && metrics.visualHeight
        ? `${metrics.visualHeight}px`
        : "100dvh",
      "--review-drawer-keyboard-offset": enabled
        ? `${metrics.keyboardOffset}px`
        : "0px",
      "--review-drawer-height":
        "min(92svh, calc(var(--review-drawer-visual-height) - 0.5rem))",
      bottom: "var(--review-drawer-keyboard-offset)",
    }),
    [enabled, metrics.keyboardOffset, metrics.visualHeight],
  );
}
