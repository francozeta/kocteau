"use client";

import type { ReactNode } from "react";
import { motion, useTransform } from "motion/react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/**
 * One physical foreground for the iPhone viewport.
 *
 * The actual Header, route content and MobileBottomBar remain children of this
 * SAME element. Unlike #294, nothing is portaled into a separate motion layer.
 * The content-frame is its own mobile scroll root; the foreground stays 100dvh
 * tall and fixed controls remain anchored to this viewport-sized surface.
 */
export default function MobileRevealInset({
  children,
  className,
  documentCanvas,
}: {
  children: ReactNode;
  className?: string;
  documentCanvas: "app" | "shell";
}) {
  const isMobile = useIsMobile();
  const { openMobile, setOpenMobile, revealProgress, revealDistance } = useSidebar();
  const offset = useTransform(revealProgress, [0, 1], [0, revealDistance]);
  const radius = useTransform(revealProgress, [0, 1], [0, 22]);
  const depth = useTransform(revealProgress, [0, 1], [0, 1]);

  return (
    <motion.main
      initial={false}
      data-slot="sidebar-inset"
      data-kocteau-document-canvas={documentCanvas}
      data-kocteau-mobile-reveal={isMobile ? "true" : undefined}
      style={isMobile ? {
        x: offset,
        borderTopLeftRadius: radius,
        borderBottomLeftRadius: radius,
      } : undefined}
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background transition-[margin,border-radius] duration-[240ms] ease-[var(--kocteau-ease)] md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 max-md:!fixed max-md:!inset-0 max-md:!h-dvh max-md:!min-h-0 max-md:!overflow-hidden max-md:!w-full",
        className,
      )}
    >
      {isMobile ? (
        <motion.div
          aria-hidden="true"
          style={{ opacity: depth }}
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-px shadow-[-15px_0_29px_13px_rgba(0,0,0,0.30)]"
        />
      ) : null}
      {children}
      {isMobile && openMobile ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpenMobile(false)}
          className="absolute inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[60] cursor-default bg-black/[0.04]"
        />
      ) : null}
    </motion.main>
  );
}
