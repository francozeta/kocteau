import Link from "next/link";
import { notFound } from "next/navigation";
import { documentLoaders } from "@/.generated/docs/loaders";
import { getDocumentationComponents } from "@/components/docs/markdown-components";
import { documentation, getDocumentationPage } from "@/lib/docs";
import { createPageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return documentation.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getDocumentationPage(slug);
  if (!page) notFound();
  return createPageMetadata({ title: `${page.title} — Docs`, description: page.description, path: page.href });
}

export default async function DocumentationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getDocumentationPage(slug);
  if (!page) notFound();
  const { default: Content } = await documentLoaders[slug]();
  const position = documentation.indexOf(page);
  const previous = documentation[position - 1];
  const next = documentation[position + 1];
  const sourceUrl = `https://github.com/francozeta/kocteau/blob/main/${page.source}`;

  return (
    <div className="grid min-w-0 gap-10 xl:grid-cols-[minmax(0,46rem)_10rem] xl:gap-12">
      <article className="min-w-0">
        <p className="mb-3 text-xs font-medium text-muted-foreground">{page.group}</p>
        <h1 id={page.titleId} className="scroll-mt-24 text-balance text-3xl font-medium tracking-tight sm:text-4xl">{page.title}</h1>
        <p className="mt-3 max-w-xl text-pretty text-base leading-7 text-muted-foreground">{page.description}</p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-b border-foreground/10 pb-7 text-xs text-muted-foreground">
          <a href={sourceUrl} className="py-1 underline underline-offset-4">View source</a>
          <a href={`${page.href}/raw`} className="py-1 underline underline-offset-4">Markdown</a>
        </div>
        <div className="mt-8 min-w-0 break-words [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:focus-visible:outline-foreground">
          <Content components={getDocumentationComponents()} />
        </div>
        <nav aria-label="Adjacent guides" className="mt-12 grid grid-cols-2 gap-6 border-t border-foreground/10 pt-6">
          <div>{previous ? <Link href={previous.href} className="block py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"><span className="mb-1 block text-xs text-muted-foreground">Previous</span>{previous.title}</Link> : null}</div>
          <div className="text-right">{next ? <Link href={next.href} className="block py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"><span className="mb-1 block text-xs text-muted-foreground">Next</span>{next.title}</Link> : null}</div>
        </nav>
      </article>
      {page.headings.length ? (
        <aside className="hidden xl:block">
          <nav aria-label="On this page" className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">
            <p className="mb-3 text-xs font-medium text-foreground/85">On this page</p>
            <ul className="space-y-2">
              {page.headings.filter((heading) => heading.depth === 2).map((heading) => (
                <li key={heading.id}><a href={`#${heading.id}`} className="block py-1 text-xs leading-5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{heading.title}</a></li>
              ))}
            </ul>
          </nav>
        </aside>
      ) : null}
    </div>
  );
}
