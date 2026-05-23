import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import HelpNav from "@/components/help/help-nav";
import HelpOnThisPage from "@/components/help/help-on-this-page";
import {
  getHelpDocument,
  helpDocuments,
  HELP_LAST_UPDATED,
  isHelpDocumentSlug,
} from "@/lib/help";
import { loadHelpDocument } from "@/lib/help-content";
import { createPageMetadata } from "@/lib/metadata";

type HelpArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return helpDocuments.map((document) => ({
    slug: document.slug,
  }));
}

export async function generateMetadata({
  params,
}: HelpArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getHelpDocument(slug);

  if (!document) {
    return createPageMetadata({
      title: "Help",
      description: "Kocteau help and platform policies.",
      path: "/help",
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: document.title,
    description: document.description,
    path: document.href,
  });
}

export default async function HelpArticlePage({ params }: HelpArticlePageProps) {
  const { slug } = await params;

  if (!isHelpDocumentSlug(slug)) {
    notFound();
  }

  const document = getHelpDocument(slug);

  if (!document) {
    notFound();
  }

  const { default: Content } = await loadHelpDocument(slug);

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[10.5rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[10.5rem_minmax(0,44rem)_13rem]">
      <aside className="hidden min-w-0 lg:block">
        <div className="sticky top-24">
          <HelpNav />
        </div>
      </aside>

      <article className="min-w-0">
        <div className="mb-4">
          <span className="rounded-full border border-[var(--kocteau-line-soft)] px-2 py-0.5 text-[11px] font-medium leading-none text-muted-foreground/58">
            {document.section}
          </span>
        </div>
        <div>
          <h1 className="max-w-2xl text-balance font-heading text-[clamp(2rem,7vw,3.25rem)] font-bold leading-[1.06] text-foreground">
            {document.title}
          </h1>
        </div>
        <p className="mt-5 max-w-[62ch] text-pretty text-[0.98rem] leading-7 text-muted-foreground/82">
          {document.description}
        </p>
        <p className="mt-4 text-[12px] text-muted-foreground/44">
          Last reviewed {HELP_LAST_UPDATED}
        </p>

        <div className="mt-10">
          <Content />
        </div>

        <footer className="mt-14">
          <Link
            href="/help"
            className="text-[13px] font-medium text-muted-foreground/72 transition-colors hover:text-foreground"
          >
            All help notes
          </Link>
        </footer>
      </article>

      <aside className="hidden min-w-0 xl:block">
        <div className="sticky top-24">
          <HelpOnThisPage document={document} />
        </div>
      </aside>
    </div>
  );
}
