"use client";

import { useRef, useState } from "react";
import { KocteauReviewsIcon } from "@/components/icons/kocteau-icons";
import { cn } from "@/lib/utils";

type RatingStarsProps = {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
  max?: number;
};

export default function RatingStars({
  value,
  onChange,
  disabled = false,
  max = 5,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const starRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeValue = hoverValue ?? value ?? 0;

  const getValueFromPointer = (
    e: React.MouseEvent<HTMLButtonElement>,
    starIndex: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;
    return isLeftHalf ? starIndex + 0.5 : starIndex + 1;
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLButtonElement>,
    starIndex: number
  ) => {
    if (disabled) return;
    setHoverValue(getValueFromPointer(e, starIndex));
  };

  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    starIndex: number
  ) => {
    if (disabled) return;
    setHoverValue(null);
    onChange(e.detail === 0 ? starIndex + 1 : getValueFromPointer(e, starIndex));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const current = value ?? 0;

    let next: number;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(max, current + 0.5);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(0.5, current - 0.5);
    else if (e.key === "Home") next = 0.5;
    else if (e.key === "End") next = max;
    else return;

    e.preventDefault();
    setHoverValue(null);
    onChange(next);
    starRefs.current[Math.ceil(next) - 1]?.focus();
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => !disabled && setHoverValue(null)}
        role="radiogroup"
        aria-label="Rating"
      >
        {Array.from({ length: max }).map((_, i) => {
          const starNumber = i + 1;

          let fillPercent = 0;
          if (activeValue >= starNumber) {
            fillPercent = 100;
          } else if (activeValue >= starNumber - 0.5) {
            fillPercent = 50;
          }

          return (
            <button
              key={i}
              ref={(node) => { starRefs.current[i] = node; }}
              type="button"
              disabled={disabled}
              className={cn(
                "relative h-8 w-8 appearance-none overflow-visible border-0 bg-transparent p-0 shadow-none outline-none transition-transform focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--kocteau-surface)]",
                !disabled && "cursor-pointer hover:bg-transparent active:bg-transparent",
                !disabled && "hover:scale-105",
                disabled && "cursor-not-allowed opacity-60"
              )}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onClick={(e) => handleClick(e, i)}
              onKeyDown={handleKeyDown}
              role="radio"
              aria-checked={value === starNumber || value === starNumber - 0.5}
              tabIndex={i === Math.max(0, Math.ceil(value ?? 1) - 1) ? 0 : -1}
              aria-label={`${value === starNumber - 0.5 ? value : starNumber} ${starNumber === 1 && value !== 0.5 ? "star" : "stars"}`}
            >
              <KocteauReviewsIcon
                className="absolute inset-0 h-8 w-8 text-muted-foreground/34 transition-colors"
                weight="regular"
              />

              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fillPercent}%` }}
              >
                <KocteauReviewsIcon
                  className="h-8 w-8 text-foreground drop-shadow-[0_0_10px_color-mix(in_oklch,var(--foreground)_22%,transparent)]"
                  weight="fill"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
