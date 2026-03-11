"use client";

import { useState } from "react";
import { Star } from "lucide-react";
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
    onChange(getValueFromPointer(e, starIndex));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const current = value ?? 0;

    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(max, current + 0.5));
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(0.5, current - 0.5));
    }

    if (e.key === "Home") {
      e.preventDefault();
      onChange(0.5);
    }

    if (e.key === "End") {
      e.preventDefault();
      onChange(max);
    }
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
              type="button"
              disabled={disabled}
              className={cn(
                "relative h-8 w-8 cursor-pointer outline-none transition-transform",
                !disabled && "hover:scale-105",
                disabled && "cursor-not-allowed opacity-60"
              )}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onClick={(e) => handleClick(e, i)}
              onKeyDown={handleKeyDown}
              role="radio"
              aria-checked={value === starNumber || value === starNumber - 0.5}
              aria-label={`${starNumber} estrellas`}
            >
              {/* estrella base */}
              <Star
                className="absolute inset-0 h-8 w-8 text-muted-foreground/40"
                fill="none"
                stroke="currentColor"
              />

              {/* capa rellenada */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fillPercent}%` }}
              >
                <Star
                  className="h-8 w-8 text-amber-400"
                  fill="currentColor"
                  stroke="currentColor"
                />
              </div>
            </button>
          );
        })}
      </div>

      <span
        className={cn(
          "text-sm font-medium whitespace-nowrap",
          value === null ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value === null ? "Elige un rating" : `${value.toFixed(1)} / ${max.toFixed(1)}`}
      </span>
    </div>
  );
}