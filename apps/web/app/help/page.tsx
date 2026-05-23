import Link from "next/link";
import HelpNav from "@/components/help/help-nav";
import { helpDocuments, HELP_LAST_UPDATED } from "@/lib/help";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Help",
  description: "Kocteau help, legal notes, privacy details, and platform policies.",
  path: "/help",
});

export default function HelpPage() {
  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[10.5rem_minmax(0,44rem)] lg:gap-10">
      <aside className="hidden min-w-0 lg:block">
        <div className="sticky top-24">
          <HelpNav />
        </div>
      </aside>

      <section className="min-w-0">
        <p className="text-[13px] font-medium text-muted-foreground/62">Help center</p>
        <h1 className="mt-5 max-w-2xl text-balance font-heading text-[clamp(2.1rem,8vw,3.35rem)] font-bold leading-[1.06] text-foreground">
          Notes for using Kocteau.
        </h1>
        <p className="mt-5 max-w-[62ch] text-pretty text-[0.98rem] leading-7 text-muted-foreground/82">
          A quiet reading surface for account rules, privacy, cookies,
          accessibility, and release notes.
        </p>

        <div className="mt-10 space-y-1">
          {helpDocuments.map((document) => (
            <Link
              key={document.slug}
              href={document.href}
              className="group block rounded-[0.62rem] px-3 py-4 transition-colors hover:bg-foreground/[0.04]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[0.98rem] font-semibold text-foreground">
                    {document.title}
                  </h2>
                  <span className="rounded-full border border-[var(--kocteau-line-soft)] px-2 py-0.5 text-[11px] leading-none text-muted-foreground/56 transition-colors group-hover:text-muted-foreground/72">
                    {document.section}
                  </span>
                </div>
                <p className="mt-1 max-w-[52ch] text-[13px] leading-6 text-muted-foreground/72">
                  {document.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-6 text-[12px] text-muted-foreground/44">
          Last reviewed {HELP_LAST_UPDATED}
        </p>
      </section>
    </div>
  );
}
