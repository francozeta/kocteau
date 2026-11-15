"use client";

import { useMemo, useState, type CSSProperties } from "react";
import EntityCoverImage from "@/components/music/entity-cover-image";
import styles from "./discovery-cover-image.module.css";

type Props = { src: string; sizes: string };

// Static material, a few soft opacity changes: no per-frame text generation.
function discPattern(seed: number, phase: number) {
  const palette = " .:+*";
  return Array.from({ length: 24 }, (_, row) =>
    Array.from({ length: 28 }, (_, column) => {
      const x = (column - 13.5) * 0.62;
      const y = (row - 11.5) * 0.82;
      const radius = Math.hypot(x, y);
      if (radius > 8.2) return " ";
      if (radius < 0.65) return "+";
      if (radius < 1.9) return radius < 1.5 ? ":" : ".";
      const groove = Math.sin(
        radius * 4.5 + Math.atan2(y, x) * 0.55 + seed + phase,
      );
      return palette[Math.max(0, Math.min(4, Math.floor((groove + 1) * 2.4)))];
    }).join(""),
  ).join("\n");
}

function LoadingCover({ src, sizes }: Props) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const { patterns, phase } = useMemo(() => {
    let salt = 0;
    for (let index = 0; index < src.length; index += 1)
      salt = (salt * 31 + src.charCodeAt(index)) | 0;
    const phase = ((salt >>> 0) % 100) / 100;
    return {
      patterns: [discPattern(phase * 6, 0), discPattern(phase * 6, 0.65)],
      phase,
    };
  }, [src]);
  return (
    <div
      className={styles.cover}
      data-discovery-cover=""
      data-cover-state={state}
      style={{ "--ascii-phase": `${-phase * 1.8}s` } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className={styles.skeleton}
        data-discovery-cover-skeleton=""
      >
        {patterns.map((pattern, index) => (
          <pre key={index} className={styles.pattern}>
            {pattern}
          </pre>
        ))}
      </div>
      <EntityCoverImage
        src={src}
        alt=""
        sizes={sizes}
        variant="card"
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        className="absolute inset-0 h-full w-full"
        imageClassName={styles.image}
      />
    </div>
  );
}

export default function DiscoveryCoverImage(props: Props) {
  // Cover identity, not carousel focus, owns the loading lifecycle.
  return <LoadingCover key={props.src} {...props} />;
}
