"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RatingStars({
  value,
  onChange,
  disabled,
}: {
  value: number | null; // 0.5..5.0
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const activeValue = hoverValue ?? value ?? 0;

  return (
    <div className="flex items-center gap-2" onMouseLeave={() => setHoverValue(null)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isFull = activeValue >= starValue;
        const isHalf = activeValue >= starValue - 0.5 && activeValue < starValue;

        return (
          <div key={i} className="relative h-8 w-8">
            <button
              type="button"
              disabled={disabled}
              onMouseEnter={() => setHoverValue(i + 0.5)}
              onFocus={() => setHoverValue(i + 0.5)}
              onClick={() => onChange(i + 0.5)}
              className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-pointer rounded-l-md disabled:cursor-not-allowed"
              aria-label={`Set rating ${i + 0.5} stars`}
            />
            <button
              type="button"
              disabled={disabled}
              onMouseEnter={() => setHoverValue(i + 1)}
              onFocus={() => setHoverValue(i + 1)}
              onClick={() => onChange(i + 1)}
              className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-pointer rounded-r-md disabled:cursor-not-allowed"
              aria-label={`Set rating ${i + 1} stars`}
            />

            <Star className="pointer-events-none absolute inset-0 h-8 w-8 text-muted-foreground/60" />

            {isHalf ? (
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
              </div>
            ) : null}

            {isFull ? (
              <Star className="pointer-events-none absolute inset-0 h-8 w-8 fill-amber-400 text-amber-400" />
            ) : null}
          </div>
        );
      })}

      <span
        className={cn(
          "text-sm font-medium",
          value === null ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value === null ? "Elige un rating" : `${value.toFixed(1)} / 5.0`}
      </span>
    </div>
  );
}
