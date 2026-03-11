"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RatingStars({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const activeValue = hoverValue ?? value ?? 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;
    setHoverValue(isLeftHalf ? starIndex + 0.5 : starIndex + 1);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;
    onChange(isLeftHalf ? starIndex + 0.5 : starIndex + 1);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1" onMouseLeave={() => setHoverValue(null)}>
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1;
          const isFull = activeValue >= starValue;
          const isHalf = activeValue >= starValue - 0.5 && activeValue < starValue;

          return (
            <div
              key={i}
              className="relative h-8 w-8 cursor-pointer"
              onMouseMove={(e) => !disabled && handleMouseMove(e, i)}
              onClick={(e) => !disabled && handleClick(e, i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (!disabled && (e.key === "ArrowRight" || e.key === "ArrowUp")) {
                  e.preventDefault();
                  onChange(Math.min(5, (value ?? 0) + 0.5));
                } else if (!disabled && (e.key === "ArrowLeft" || e.key === "ArrowDown")) {
                  e.preventDefault();
                  onChange(Math.max(0.5, (value ?? 0) - 0.5));
                }
              }}
              aria-label={`Star ${i + 1} of 5`}
            >
              {/* base */}
              <Star className="pointer-events-none absolute inset-0 h-8 w-8 text-muted-foreground/50" />

              {/* half */}
              {isHalf ? (
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                  <Star className="h-8 w-8 text-amber-400" fill="currentColor" />
                </div>
              ) : null}

              {/* full */}
              {isFull ? (
                <Star
                  className="pointer-events-none absolute inset-0 h-8 w-8 text-amber-400"
                  fill="currentColor"
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <span
        className={cn(
          "text-sm font-medium whitespace-nowrap",
          value === null ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value === null ? "Elige un rating" : `${value.toFixed(1)} / 5.0`}
      </span>
    </div>
  );
}