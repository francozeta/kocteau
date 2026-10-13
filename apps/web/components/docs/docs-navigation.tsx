"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState, type MouseEvent } from "react";
import type { DocumentationPage } from "@/lib/docs";
import { cn } from "@/lib/utils";

export default function DocsNavigation({ pages }: { pages: DocumentationPage[] }) {
  const pathname = usePathname();
  const id = useId();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const filtered = pages.filter((page) =>
    [page.title, page.description, page.group, ...page.headings.map((heading) => heading.title)]
      .join(" ").toLowerCase().includes(normalized),
  );
  const groups = [...new Set(filtered.map((page) => page.group))];

  function closeMobileMenu(event: MouseEvent<HTMLAnchorElement>) {
    const menu = event.currentTarget.closest("details");
    if (menu) menu.open = false;
  }

  return (
    <nav aria-label="Documentation guides" className="space-y-6">
      <div>
        <label htmlFor={id} className="mb-2 block text-xs font-medium text-foreground/80">Find a guide</label>
        <input
          id={id}
          name="documentation-search"
          type="search"
          autoComplete="off"
          placeholder="Search guides…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-10 w-full rounded-md border border-foreground/15 bg-transparent px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:text-sm"
        />
        <p role="status" className="mt-2 min-h-4 text-xs text-muted-foreground">
          {normalized ? `${filtered.length} ${filtered.length === 1 ? "guide" : "guides"} found` : ""}
        </p>
      </div>
      <Link href="/docs" onClick={closeMobileMenu} aria-current={pathname === "/docs" ? "page" : undefined} className="block py-2 text-sm text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
        Overview
      </Link>
      {groups.map((group) => (
        <div key={group}>
          <p className="mb-2 text-xs font-semibold text-foreground/85">{group}</p>
          <ul>
            {filtered.filter((page) => page.group === group).map((page) => (
              <li key={page.slug}>
                <Link
                  href={page.href}
                  onClick={closeMobileMenu}
                  aria-current={pathname === page.href ? "page" : undefined}
                  className={cn("flex min-h-10 items-center border-l px-3 py-2 text-sm leading-5 underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground", pathname === page.href ? "border-foreground font-medium text-foreground" : "border-foreground/10 text-muted-foreground")}
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
