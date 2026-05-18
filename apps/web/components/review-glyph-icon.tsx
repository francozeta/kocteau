import { cn } from "@/lib/utils";

export default function ReviewGlyphIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn("icon size-5 shrink-0", className)}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.75 3.25A2.75 2.75 0 0 0 2 6v8a2.75 2.75 0 0 0 2.75 2.75H11a.75.75 0 0 0 0-1.5H4.75A1.25 1.25 0 0 1 3.5 14V6c0-.69.56-1.25 1.25-1.25h10.5c.69 0 1.25.56 1.25 1.25v3.65a.75.75 0 0 0 1.5 0V6a2.75 2.75 0 0 0-2.75-2.75H4.75Zm2 3.5A.75.75 0 0 0 6 7.5c0 .41.34.75.75.75h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3A.75.75 0 0 0 6 10.5c0 .41.34.75.75.75h3.75a.75.75 0 0 0 0-1.5H6.75Z"
      />
      <path d="M15.88 11.08a1.47 1.47 0 0 1 2.08 2.08l-3.62 3.62a1.8 1.8 0 0 1-.77.45l-1.76.5a.55.55 0 0 1-.68-.68l.5-1.76c.09-.29.24-.56.45-.77l3.8-3.44Z" />
    </svg>
  );
}
