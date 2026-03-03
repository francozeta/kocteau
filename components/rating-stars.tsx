"use client";

import { Star } from "lucide-react";

export default function RatingStars({
  value,
  onChange,
  disabled,
}: {
  value: number; // 0.5..5.0
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  function setFromStar(index: number, half: boolean) {
    const v = index + (half ? 0.5 : 1);
    onChange(v);
  }

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isFull = value >= starValue;
        const isHalf = !isFull && value >= starValue - 0.5;

        return (
          <div key={i} className="relative h-6 w-6">
            {/* Click izquierda = 0.5 */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setFromStar(i, true)}
              className="absolute left-0 top-0 h-full w-1/2 cursor-pointer"
              aria-label={`Set rating ${i + 0.5}`}
            />
            {/* Click derecha = 1 */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setFromStar(i, false)}
              className="absolute right-0 top-0 h-full w-1/2 cursor-pointer"
              aria-label={`Set rating ${i + 1}`}
            />

            {/* Base outline */}
            <Star className="h-6 w-6 opacity-60" />

            {/* Half fill */}
            {isHalf ? (
              <div className="absolute left-0 top-0 h-full w-1/2 overflow-hidden">
                <Star className="h-6 w-6 fill-current" />
              </div>
            ) : null}

            {/* Full fill */}
            {isFull ? (
              <Star className="absolute left-0 top-0 h-6 w-6 fill-current" />
            ) : null}
          </div>
        );
      })}

      <span className="ml-2 text-xs opacity-70">{value.toFixed(1)} / 5.0</span>
    </div>
  );
}