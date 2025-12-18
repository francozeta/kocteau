"use client"

interface DeezerWidgetProps {
  trackId: number
  type?: "track" | "album"
}

export function DeezerWidget({ trackId, type = "track" }: DeezerWidgetProps) {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-border shadow-sm">
      <iframe
        title="deezer-widget"
        src={`https://widget.deezer.com/widget/dark/${type}/${trackId}`}
        width="100%"
        height={type === "album" ? 300 : 150}
        frameBorder={0}
        allow="encrypted-media; clipboard-write"
        loading="lazy"
        className="w-full"
      />
    </div>
  )
}
