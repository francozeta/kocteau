
export default function Page() {
  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <iframe
        title="deezer-widget"
        src="https://widget.deezer.com/widget/dark/track/138547415"
        width="100%"
        height={150}
        frameBorder={0}
        allow="encrypted-media; clipboard-write"
        loading="lazy"
      />

      <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" />
    </>
  )
}
