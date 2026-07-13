"use client"

import { useEffect, useId, useRef } from "react"
import type { Transition } from "motion/react"
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"

import { metalClickSound } from "@/lib/metal-click"
import { useSound } from "@/hooks/use-sound"

const transition: Transition = {
  type: "spring",
  mass: 0.5,
  damping: 18,
  stiffness: 200,
}

const logoPaths = [
  "M936.28,5.38c-47.64,96.32-97.78,189.02-164.48,271.66-61.13,75.75-132.42,139.56-219.99,183.52-22.62,11.36-46.49,20.21-70.39,30.47,11.51,3.71,23.23,7.22,34.77,11.24,80.77,28.11,151.18,72.69,211.94,132.83,70.47,69.74,120.36,153.19,161.95,242.18,10.53,22.53,20.2,45.46,30.22,68.23,1.02,2.33,1.8,4.76,3.01,8.02-13.71,0-26.56,0-39.4,0-68.76-.01-137.52-.15-206.28.15-6.58.03-9.11-2.25-11.27-7.92-22.18-58.19-48.92-114.18-84.18-165.65-74.57-108.85-175.11-182.98-300.92-222.7-47.58-15.02-96.27-25.09-146.06-28.38-41.85-2.76-83.81-3.75-125.72-5.49-2.88-.12-5.78-.02-9.26-.02v-38.86c13.56-1.06,27.19-2.18,40.83-3.19,141.94-10.57,271.99-54.24,387.03-139.39,63.19-46.78,115.32-104.14,159.54-168.87,33.98-49.74,62.31-102.61,85.87-158.01,3.21-7.55,7.27-10.04,15.54-10,79.04.34,158.09.19,237.14.18,2.88,0,5.76,0,10.11,0Z",
  "M.43.27c68.46-1.77,134.64,4.37,195.17,39.26,76.23,43.94,122.94,109.35,142.48,194.7,7.39,32.26,8.63,65.07,8.21,97.96-.05,3.66-4.01,8.11-7.3,10.77-41.48,33.44-88.98,54.59-140.28,67.81-8.4,2.16-16.87,4.03-26.28,6.26,0-16.85.49-32.38-.11-47.87-.98-24.87.26-50.32-4.67-74.45-11.78-57.69-55.36-96.93-113.94-105.93-17.32-2.66-34.94-3.43-53.29-5.15V.27Z",
  "M.2,653.1v-92.2c14.54,0,28.58-.76,42.51.14,48.58,3.14,96.68,10.07,143.2,24.6,140.53,43.89,243.61,132.23,307.97,264.53,14.61,30.03,24.03,62.59,35.75,94.02.99,2.66,1.3,5.58,2.05,8.93h-174.6C318.98,756.93,198.58,658.98.2,653.1Z",
  "M0,952.87v-256.18c58.83-.6,111.98,14.35,157.19,52.58,63.38,53.59,77.4,124.71,70.51,203.61H0Z",
] as const

const extrusionOffsets = Array.from(
  { length: 16 },
  (_, index) => (16 - index) * 2,
)

/**
 * An SVG mark whose outline is traced by a gradient highlight that follows the
 * cursor, paired with a springy press effect and a tactile click sound.
 *
 * Swap the SVG paths below for your own artwork. The interaction is driven by:
 * - a `radialGradient` whose center springs toward the pointer (the spotlight),
 *   reused as a second stroke layered over the base outline.
 * - `whileTap="pressed"` compressing the top face into its extrusion.
 *
 * The demo mark was designed by ncdai on Figma with the
 * [Fast Isometric Plugin](https://www.figma.com/community/plugin/1249759048471403961).
 * Inspired by tailwindcss.com.
 */
export function SpotlightLogo() {
  const id = useId()
  const ids = {
    logoShape: `spotlight-logo-shape-${id}`,
    topFace: `spotlight-logo-top-face-${id}`,
    facePattern: `spotlight-logo-face-pattern-${id}`,
    faceFill: `spotlight-logo-face-fill-${id}`,
    stroke: `spotlight-logo-stroke-${id}`,
    topGradient: `spotlight-logo-top-gradient-${id}`,
    topHighlight: `spotlight-logo-top-highlight-${id}`,
    sideGradient: `spotlight-logo-side-gradient-${id}`,
    radialGradient: `spotlight-logo-radial-gradient-${id}`,
    shadow: `spotlight-logo-shadow-${id}`,
  }

  const ref = useRef<SVGSVGElement>(null)

  const [play] = useSound(metalClickSound)

  const shouldReduceMotion = useReducedMotion()
  const isInView = useInView(ref, { margin: "80px" })

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const cx = useSpring(useTransform(mouseX, [0, 1], [0, 760]), {
    stiffness: 300,
    damping: 30,
    mass: 0.1,
  })

  const cy = useSpring(useTransform(mouseY, [0, 1], [0, 480]), {
    stiffness: 300,
    damping: 30,
    mass: 0.1,
  })

  useEffect(() => {
    if (shouldReduceMotion || !isInView) {
      return
    }

    if (window.matchMedia("(hover: none)").matches) {
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth)
      mouseY.set(e.clientY / window.innerHeight)
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [shouldReduceMotion, isInView, mouseX, mouseY])

  return (
    <motion.svg
      ref={ref}
      className="h-auto w-full touch-manipulation [--outline:color-mix(in_oklab,var(--foreground)_42%,var(--background))] [--pattern:color-mix(in_oklab,var(--foreground)_27%,var(--background))] [--side:color-mix(in_oklab,var(--foreground)_20%,var(--background))]"
      viewBox="0 0 760 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      initial="normal"
      whileTap="pressed"
      onTap={() => play()}
    >
      <defs>
        <g id={ids.logoShape}>
          {logoPaths.map((path) => (
            <path key={path} d={path} />
          ))}
        </g>

        <g
          id={ids.topFace}
          transform="matrix(0.4 -0.2 -0.4 -0.2 382 430)"
        >
          <g transform="translate(0 953.67) scale(1 -1)">
            <use href={`#${ids.logoShape}`} />
          </g>
        </g>

        <pattern
          id={ids.facePattern}
          x="0"
          y="0"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M-1 1l2-2M0 12 12 0M11 13l2-2"
            stroke="var(--pattern)"
            strokeWidth="1"
          />
        </pattern>

        <linearGradient
          id={ids.topGradient}
          x1="180"
          y1="70"
          x2="590"
          y2="410"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="color-mix(in oklab, var(--foreground) 36%, var(--background))" />
          <stop offset="0.55" stopColor="color-mix(in oklab, var(--foreground) 25%, var(--background))" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--foreground) 18%, var(--background))" />
        </linearGradient>

        <linearGradient
          id={ids.topHighlight}
          x1="250"
          y1="75"
          x2="500"
          y2="365"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.28" />
          <stop offset="0.42" stopColor="white" stopOpacity="0.08" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>

        <linearGradient
          id={ids.sideGradient}
          x1="380"
          y1="120"
          x2="380"
          y2="450"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="color-mix(in oklab, var(--foreground) 22%, var(--background))" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--foreground) 10%, var(--background))" />
        </linearGradient>

        <filter
          id={ids.shadow}
          x="-20%"
          y="-20%"
          width="140%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="16"
            floodColor="#000"
            floodOpacity="0.36"
          />
        </filter>

        <motion.g
          id={ids.faceFill}
          variants={{
            normal: {
              transform: "translate(0px, 0px)",
            },
            pressed: {
              transform: "translate(0px, 16px)",
            },
          }}
          transition={transition}
        >
          <use href={`#${ids.topFace}`} />
        </motion.g>

        <motion.g
          id={ids.stroke}
          variants={{
            normal: { transform: "translate(0px, 0px)" },
            pressed: { transform: "translate(0px, 16px)" },
          }}
          transition={transition}
        >
          <use href={`#${ids.topFace}`} />
        </motion.g>

        <motion.radialGradient
          id={ids.radialGradient}
          cx={cx}
          cy={cy}
          r="245"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            className="dark:[stop-color:#fff]"
            stopColor="var(--color-zinc-700)"
          />
          <stop
            className="dark:[stop-color:var(--color-zinc-600)]"
            offset="1"
            stopColor="var(--color-zinc-400)"
            stopOpacity="0"
          />
        </motion.radialGradient>
      </defs>

      <g filter={`url(#${ids.shadow})`} aria-hidden>
        {extrusionOffsets.map((offset) => (
          <motion.g
            key={offset}
            variants={{
              normal: {
                transform: `translate(0px, ${offset}px)`,
              },
              pressed: {
                transform: `translate(0px, ${Math.max(offset, 18)}px)`,
              },
            }}
            transition={transition}
          >
            <use
              href={`#${ids.topFace}`}
              fill={`url(#${ids.sideGradient})`}
            />
          </motion.g>
        ))}
        <use
          href={`#${ids.topFace}`}
          transform="translate(0 32)"
          fill="none"
          stroke="var(--outline)"
          opacity="0.46"
          strokeWidth="2"
        />
      </g>

      <use href={`#${ids.faceFill}`} fill={`url(#${ids.topGradient})`} />
      <use href={`#${ids.faceFill}`} fill={`url(#${ids.topHighlight})`} />
      <use href={`#${ids.faceFill}`} fill={`url(#${ids.facePattern})`} />

      <use
        href={`#${ids.stroke}`}
        fill="none"
        stroke="var(--outline)"
        strokeWidth="2"
      />
      <use
        href={`#${ids.stroke}`}
        fill="none"
        stroke={`url(#${ids.radialGradient})`}
        strokeWidth="3"
      />
      <use
        href={`#${ids.faceFill}`}
        fill={`url(#${ids.radialGradient})`}
        opacity="0.16"
      />
    </motion.svg>
  )
}
