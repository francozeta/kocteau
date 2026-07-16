"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

const DitheringShader = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.Dithering),
  {
    ssr: false,
  },
);

const markMaskStyle = {
  WebkitMaskImage: 'url("/marks/aphex-twin-negative.png")',
  WebkitMaskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskSize: "contain",
  maskImage: 'url("/marks/aphex-twin-negative.png")',
  maskPosition: "center",
  maskRepeat: "no-repeat",
  maskSize: "contain",
} satisfies CSSProperties;

type GuestDitheredMarkProps = {
  className?: string;
};

export default function GuestDitheredMark({
  className,
}: GuestDitheredMarkProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(query.matches);

    sync();
    query.addEventListener("change", sync);

    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none overflow-hidden mix-blend-screen",
        className,
      )}
      style={markMaskStyle}
    >
      <DitheringShader
        colorBack="#0a0a0a"
        colorFront="#f7f7f5"
        fit="cover"
        height="100%"
        maxPixelCount={520_000}
        minPixelRatio={1}
        offsetX={0.08}
        rotation={0}
        scale={0.92}
        shape="warp"
        size={2}
        speed={prefersReducedMotion ? 0 : 0.12}
        style={{ height: "100%", width: "100%" }}
        type="4x4"
        width="100%"
      />
    </div>
  );
}
