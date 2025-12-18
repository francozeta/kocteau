"use client"

interface DeezerWidgetProps {
  trackId: number
}

export function DeezerWidget({ trackId }: DeezerWidgetProps) {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-border shadow-sm">
      <iframe
        title="deezer-widget"
        src={`https://widget.deezer.com/widget/dark/track/${trackId}`}
        width="100%"
        height={152}
        frameBorder={0}
        allow="encrypted-media; clipboard-write"
        loading="lazy"
        className="w-full"
      />
    </div>
  )
}
