import { publicChangelogEntries } from "@/content/changelog/entries";

export default function HelpChangelog() {
  const entries = publicChangelogEntries.filter((entry) => !entry.draft);
  const [latestEntry, ...previousEntries] = entries;

  if (!latestEntry) {
    return (
      <p className="max-w-[68ch] text-[0.94rem] leading-7 text-muted-foreground/82">
        Public release notes will appear here after the first Kocteau product note.
      </p>
    );
  }

  return (
    <div className="space-y-14">
      <section aria-labelledby="latest-note">
        <h2
          id="latest-note"
          className="scroll-m-24 text-balance font-heading text-[1.22rem] font-medium leading-tight text-foreground"
        >
          Latest note
        </h2>
        <div className="mt-7">
          <ChangelogEntry entry={latestEntry} />
        </div>
      </section>

      {previousEntries.length > 0 ? (
        <section aria-labelledby="release-archive">
          <h2
            id="release-archive"
            className="scroll-m-24 text-balance font-heading text-[1.22rem] font-medium leading-tight text-foreground"
          >
            Release archive
          </h2>
          <div className="mt-7 space-y-12">
            {previousEntries.map((entry) => (
              <ChangelogEntry key={entry.slug} entry={entry} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ChangelogEntry({
  entry,
}: {
  entry: (typeof publicChangelogEntries)[number];
}) {
  const Content = entry.Content;

  return (
    <article className="max-w-[68ch]">
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground/54">
        <time dateTime={entry.date}>{formatDate(entry.date)}</time>
        {entry.version ? (
          <span className="rounded-full border border-[var(--kocteau-line-soft)] px-2 py-0.5 leading-none text-muted-foreground/58">
            v{entry.version}
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-balance font-heading text-[1.55rem] font-medium leading-tight text-foreground">
        {entry.title}
      </h3>
      <p className="mt-3 text-pretty text-[0.95rem] leading-7 text-muted-foreground/82">
        {entry.summary}
      </p>

      <div className="mt-8">
        <Content />
      </div>
    </article>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}
