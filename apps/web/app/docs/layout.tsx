import Link from "next/link";
import type { ReactNode } from "react";
import DocsNavigation from "@/components/docs/docs-navigation";
import { documentation } from "@/lib/docs";

export default function DocumentationLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#documentation-content" className="fixed left-4 top-3 z-50 -translate-y-24 bg-foreground px-4 py-3 text-sm text-background focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background">
        <div className="mx-auto flex min-h-16 max-w-[88rem] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-heading text-lg font-medium tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">Kocteau</Link>
            <span aria-hidden="true" className="text-foreground/25">/</span>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">Docs</Link>
          </div>
          <a href="https://github.com/francozeta/kocteau" className="py-3 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">GitHub</a>
        </div>
      </header>
      <div className="mx-auto max-w-[88rem] px-5 sm:px-8">
        <details className="border-b border-foreground/10 py-4 lg:hidden">
          <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">Browse guides</summary>
          <div className="py-4"><DocsNavigation pages={documentation} /></div>
        </details>
        <div className="grid min-w-0 gap-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] overflow-y-auto py-8 pr-3 lg:block">
            <DocsNavigation pages={documentation} />
          </aside>
          <main id="documentation-content" tabIndex={-1} className="min-w-0 py-10 focus:outline-none sm:py-14">{children}</main>
        </div>
      </div>
    </div>
  );
}
