export default function SettingsLoading() {
  return (
    <div
      role="status"
      aria-label="Loading settings"
      className="w-full pb-16 pt-7 md:pb-20 md:pt-10"
    >
      <div className="mb-8 space-y-2">
        <div className="h-7 w-32 animate-pulse rounded-md bg-foreground/[0.075]" />
        <div className="h-4 w-full max-w-sm animate-pulse rounded-md bg-foreground/[0.045]" />
      </div>

      <div className="space-y-3">
        <div className="h-4 w-16 animate-pulse rounded bg-foreground/[0.065]" />
        <div className="overflow-hidden rounded-[0.9rem] border border-border/18 bg-[var(--kocteau-surface)]">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="grid min-h-16 gap-3 border-b border-border/14 px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,22rem)] sm:items-center sm:gap-8 sm:px-5"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-foreground/[0.055]" />
              <div className="h-9 w-full animate-pulse rounded-[0.62rem] bg-foreground/[0.045]" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading settings…</span>
    </div>
  );
}
