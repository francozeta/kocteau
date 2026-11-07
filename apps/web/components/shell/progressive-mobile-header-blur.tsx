import type { CSSProperties } from "react";

// Same four progressive blur strengths and vertical mask stops as Craft's mobile header.
// Keep the effect behind header controls so search portals, actions and back buttons stay sharp.
const BLUR_STRENGTHS = [1, 2, 4, 8] as const;

export default function ProgressiveMobileHeaderBlur() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[calc(100%+3rem)] overflow-hidden md:hidden"
    >
      {BLUR_STRENGTHS.map((blur, index) => (
        <div
          key={blur}
          className="kocteau-mobile-header-blur-layer absolute inset-0"
          style={
            {
              "--header-blur": `${blur}px`,
              "--header-blur-start": `${index * 20}%`,
              "--header-blur-end": `${index * 20 + 30}%`,
            } as CSSProperties
          }
        />
      ))}
      <div className="kocteau-mobile-header-blur-tint absolute inset-0" />
    </div>
  );
}
