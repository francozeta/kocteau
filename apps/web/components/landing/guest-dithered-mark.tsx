"use client";

import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/utils";

const DitheringShader = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({
    default: mod.Dithering,
  })),
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
  const markRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isShaderReady, setIsShaderReady] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(query.matches);

    sync();
    query.addEventListener("change", sync);

    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const node = markRef.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsShaderReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "420px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={markRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none overflow-hidden mix-blend-screen",
        className,
      )}
      style={markMaskStyle}
    >
      <div className="absolute inset-0 bg-foreground/[0.16]" />
      {isShaderReady ? (
        <Suspense fallback={null}>
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
        </Suspense>
      ) : null}
    </div>
  );
}
