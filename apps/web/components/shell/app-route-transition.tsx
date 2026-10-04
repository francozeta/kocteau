"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  type Variants,
  useReducedMotion,
} from "motion/react";
import { usePathname } from "next/navigation";

type Direction = -1 | 1;

const routeTransitionDirectionEvent = "kocteau:route-transition-direction";

type TransitionContext = {
  direction: Direction;
  shouldReduceMotion: boolean;
};

const pageTransition = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

const pageVariants: Variants = {
  enter: ({ direction, shouldReduceMotion }: TransitionContext) =>
    shouldReduceMotion
      ? { opacity: 1, x: 0, filter: "blur(0px)", pointerEvents: "none" }
      : {
          opacity: 0,
          x: direction * 8,
          filter: "blur(2px)",
          pointerEvents: "none",
        },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    pointerEvents: "auto",
  },
  exit: ({ direction, shouldReduceMotion }: TransitionContext) =>
    shouldReduceMotion
      ? { opacity: 1, x: 0, filter: "blur(0px)", pointerEvents: "none" }
      : {
          opacity: 0,
          x: direction * -8,
          filter: "blur(2px)",
          pointerEvents: "none",
        },
};

export function setAppRouteTransitionDirection(direction: Direction) {
  window.dispatchEvent(
    new CustomEvent<Direction>(routeTransitionDirectionEvent, {
      detail: direction,
    }),
  );
}

export default function AppRouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [direction, setDirection] = useState<Direction>(1);
  const transitionContext: TransitionContext = {
    direction,
    shouldReduceMotion: Boolean(shouldReduceMotion),
  };

  useEffect(() => {
    function handleDirection(event: Event) {
      const nextDirection = (event as CustomEvent<Direction>).detail;

      if (nextDirection === -1 || nextDirection === 1) {
        setDirection(nextDirection);
      }
    }

    function handleHistoryNavigation() {
      setDirection(-1);
    }

    window.addEventListener(routeTransitionDirectionEvent, handleDirection);
    window.addEventListener("popstate", handleHistoryNavigation);

    return () => {
      window.removeEventListener(routeTransitionDirectionEvent, handleDirection);
      window.removeEventListener("popstate", handleHistoryNavigation);
    };
  }, []);

  return (
    <div
      data-kocteau-route-transition
      className="relative min-h-full w-full overflow-x-clip"
    >
      <AnimatePresence
        initial={false}
        mode="popLayout"
        custom={transitionContext}
        onExitComplete={() => setDirection(1)}
      >
        <motion.div
          key={pathname}
          custom={transitionContext}
          variants={pageVariants}
          initial="enter"
          animate="visible"
          exit="exit"
          transition={shouldReduceMotion ? { duration: 0 } : pageTransition}
          data-kocteau-route-page={pathname}
          className="min-h-full w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
