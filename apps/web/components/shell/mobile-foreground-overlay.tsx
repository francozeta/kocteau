"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useTransform } from "motion/react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Fixed controls must not live under a transformed long-scrolling main:
 * CSS transforms redefine the containing block for position: fixed.
 * Portal them to the viewport, but drive their x position with the very same
 * reveal progress as the foreground. Header and bottom dock stay in lockstep.
 */
export default function MobileForegroundOverlay({ children, depthShadow = false }: { children: ReactNode; depthShadow?: boolean }) {
  const isMobile = useIsMobile();
  const { openMobile, revealProgress, revealDistance } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const overlayX = useTransform(revealProgress, [0, 1], [0, revealDistance]);
  const depthOpacity = useTransform(revealProgress, value => Math.max(0, Math.min(1, value)));

  useEffect(() => setMounted(true), []);

  if (!mounted || !isMobile) return <>{children}</>;

  return createPortal(
    <motion.div
      initial={false}
      data-kocteau-mobile-foreground-overlay
      inert={openMobile}
      style={{ x: overlayX }}
      className="pointer-events-none fixed inset-0 z-50 h-dvh md:hidden"
    >
      {depthShadow ? (
        <motion.div
          aria-hidden="true"
          style={{ opacity: depthOpacity }}
          className="pointer-events-none absolute inset-y-0 left-0 z-0 w-px shadow-[-14px_0_30px_12px_rgba(0,0,0,0.16)]"
        />
      ) : null}
      {children}
    </motion.div>,
    document.body,
  );
}
