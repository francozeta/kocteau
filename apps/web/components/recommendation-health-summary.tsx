import Link from "next/link";
import {
  formatRecommendationReason,
  recommendationHealthWindows,
  type EntityDestinationHealth,
  type RecommendationHealthSnapshot,
  type RecommendationHealthWindow,
  type StarterTrackHealth,
  type StarterTagCoverage,
} from "@/lib/recommendation-health/metrics";
import { cn } from "@/lib/utils";

type RecommendationHealthSummaryProps = {
  snapshot: RecommendationHealthSnapshot;
  selectedDays: RecommendationHealthWindow;
  unavailable?: boolean;
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("en", {
    maximumFractionDigits: value < 0.1 ? 2 : 1,
    minimumFractionDigits: 0,
  }).format(value * 100)}%`;
}

function formatTrackLabel(track: StarterTrackHealth) {
  if (track.title && track.artistName) {
    return `${track.title} by ${track.artistName}`;
  }

  return track.title ?? track.providerId ?? track.starterTrackId;
}

function formatEntityLabel(entity: EntityDestinationHealth) {
  if (entity.title && entity.artistName) {
    return `${entity.title} by ${entity.artistName}`;
  }

  return entity.title ?? entity.providerId ?? entity.entityId;
}

function MetricTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="min-h-[6.5rem] rounded-[var(--kocteau-radius-card)] border border-border/22 bg-card/28 px-4 py-3.5">
      <p className="text-[12px] font-medium text-muted-foreground/70">{label}</p>
      <p className="mt-2 font-serif text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[12px] leading-5 text-muted-foreground/68">{note}</p>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--kocteau-radius-card)] border border-border/20 bg-card/20 px-4 py-5 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function TagCoverageList({ items }: { items: StarterTagCoverage[] }) {
  if (items.length === 0) {
    return <EmptyRow label="No active starter tag coverage yet." />;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.slice(0, 8).map((item) => (
        <div
          key={item.kind}
          className="rounded-[var(--kocteau-radius-card)] border border-border/20 bg-card/22 px-3.5 py-3"
        >
          <p className="text-sm font-medium text-foreground">
            {formatRecommendationReason(item.kind)}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground/70">
            {formatCount(item.taggedTracks)} tracks, {formatCount(item.tagCount)} tags
          </p>
        </div>
      ))}
    </div>
  );
}

export default function RecommendationHealthSummary({
  snapshot,
  selectedDays,
  unavailable = false,
}: RecommendationHealthSummaryProps) {
  const { feed, starter } = snapshot;
  const topReasons = snapshot.reasons.slice(0, 8);
  const topStarterTracks = snapshot.starterTracks.slice(0, 8);
  const topEntities = snapshot.entities.slice(0, 8);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[12px] font-medium text-muted-foreground/72">Studio</p>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Recommendation health
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Aggregate signals for For You and starter picks.
          </p>
        </div>

        <div className="inline-flex w-fit rounded-[0.68rem] border border-border/24 bg-card/26 p-1">
          {recommendationHealthWindows.map((days) => (
            <Link
              key={days}
              href={`/studio/health?days=${days}`}
              className={cn(
                "inline-flex h-7 min-w-10 items-center justify-center rounded-md px-2 text-[12px] font-medium tabular-nums text-muted-foreground transition-colors",
                selectedDays === days && "bg-foreground text-background",
              )}
            >
              {days}d
            </Link>
          ))}
        </div>
      </div>

      {unavailable ? (
        <div className="rounded-[var(--kocteau-radius-card)] border border-border/28 bg-card/24 px-4 py-3 text-sm leading-6 text-muted-foreground">
          Recommendation health RPC is not available yet. Apply the local Supabase
          migration before reading this surface in production.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Feed loads"
          value={formatCount(feed.loads)}
          note={`${formatCount(feed.reviewImpressions)} review impressions`}
        />
        <MetricTile
          label="Fallback rate"
          value={formatPercent(feed.fallbackRate)}
          note={`${formatCount(feed.fallbacks)} fallback events`}
        />
        <MetricTile
          label="Review open rate"
          value={formatPercent(feed.reviewOpenRate)}
          note={`${formatCount(feed.reviewOpens)} review opens`}
        />
        <MetricTile
          label="Starter conversion"
          value={formatPercent(starter.reviewConversionRate)}
          note={`${formatCount(starter.reviewsPublished)} reviews published`}
        />
      </div>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Recommendation reasons</h2>
          <span className="text-[12px] text-muted-foreground">
            {formatCount(topReasons.length)} shown
          </span>
        </div>
        {topReasons.length > 0 ? (
          <div className="divide-y divide-border/14 rounded-[var(--kocteau-radius-card)] border border-border/20 bg-card/22">
            {topReasons.map((reason) => (
              <div
                key={reason.reason}
                className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_4.75rem] items-center gap-2 px-3.5 py-3 text-[13px]"
              >
                <p className="truncate font-medium text-foreground">
                  {formatRecommendationReason(reason.reason)}
                </p>
                <p className="text-right tabular-nums text-muted-foreground">
                  {formatCount(reason.impressions)}
                </p>
                <p className="text-right tabular-nums text-muted-foreground">
                  {formatCount(reason.opens)}
                </p>
                <p className="text-right tabular-nums text-foreground">
                  {formatPercent(reason.openRate)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyRow label="No recommendation reason signals yet." />
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-sm font-semibold text-foreground">Starter picks</h2>
        {topStarterTracks.length > 0 ? (
          <div className="divide-y divide-border/14 rounded-[var(--kocteau-radius-card)] border border-border/20 bg-card/22">
            {topStarterTracks.map((track) => (
              <div
                key={track.starterTrackId}
                className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_4.75rem] items-center gap-2 px-3.5 py-3 text-[13px]"
              >
                <p className="truncate font-medium text-foreground">
                  {formatTrackLabel(track)}
                </p>
                <p className="text-right tabular-nums text-muted-foreground">
                  {formatCount(track.impressions)}
                </p>
                <p className="text-right tabular-nums text-muted-foreground">
                  {formatCount(track.passes)}
                </p>
                <p className="text-right tabular-nums text-foreground">
                  {formatPercent(track.reviewConversionRate)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyRow label="No starter pick signals yet." />
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-sm font-semibold text-foreground">Starter tag coverage</h2>
        <TagCoverageList items={snapshot.tagCoverage} />
      </section>

      <section className="space-y-2.5">
        <h2 className="text-sm font-semibold text-foreground">Track destinations</h2>
        {topEntities.length > 0 ? (
          <div className="divide-y divide-border/14 rounded-[var(--kocteau-radius-card)] border border-border/20 bg-card/22">
            {topEntities.map((entity) => (
              <div
                key={entity.entityId}
                className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2 px-3.5 py-3 text-[13px]"
              >
                <p className="truncate font-medium text-foreground">
                  {formatEntityLabel(entity)}
                </p>
                <p className="text-right tabular-nums text-foreground">
                  {formatCount(entity.opens)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyRow label="No track destination signals yet." />
        )}
      </section>
    </section>
  );
}
