import Link from "next/link";
import { documentation } from "@/lib/docs";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Documentation",
  description: "Set up Kocteau, find product components, and follow the project's technical and maintainer guides.",
  path: "/docs",
});

export default function DocumentationIndex() {
  const groups = [...new Set(documentation.map((page) => page.group))];
  return (
    <div className="max-w-3xl">
      <h1 className="text-balance text-4xl font-medium tracking-tight sm:text-5xl">Documentation</h1>
      <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-muted-foreground">Setup, product flows, and maintainer procedures.</p>
      <p className="mt-5 text-sm text-muted-foreground">New here? Start with <Link href="/docs/setup" className="text-foreground underline underline-offset-4">local development</Link>, then read the <Link href="/docs/current" className="text-foreground underline underline-offset-4">current state</Link>.</p>
      {groups.map((group) => (
        <section key={group} aria-labelledby={`group-${group.toLowerCase()}`} className="mt-12">
          <h2 id={`group-${group.toLowerCase()}`} className="mb-3 text-xl font-medium">{group}</h2>
          <ul className="divide-y divide-foreground/10 border-y border-foreground/10">
            {documentation.filter((page) => page.group === group).map((page) => (
              <li key={page.slug}>
                <Link href={page.href} className="group flex flex-col gap-1 py-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:flex-row sm:gap-5">
                  <span className="w-48 shrink-0 text-sm font-medium text-foreground underline-offset-4 group-hover:underline">{page.title}</span>
                  <span className="text-sm leading-6 text-muted-foreground">{page.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-12 text-xs text-muted-foreground">Sources live in the repository. <a href="/docs/llms.txt" className="underline underline-offset-4">Text index</a></p>
    </div>
  );
}
