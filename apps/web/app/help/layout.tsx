import Link from "next/link";
import type { ReactNode } from "react";
import HelpMobileMenu from "@/components/help/help-mobile-menu";
import BrandLogo from "@/components/brand-logo";

type HelpLayoutProps = {
  children: ReactNode;
};

export default function HelpLayout({ children }: HelpLayoutProps) {
  return (
    <main className="min-h-screen bg-[var(--kocteau-canvas)] text-foreground">
      <header className="sticky top-0 z-40 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto grid h-12 w-full max-w-6xl grid-cols-[1fr_auto] items-center gap-3 rounded-full bg-black/42 px-2.5 shadow-[0_0_0_1px_var(--kocteau-line-soft)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/34 sm:px-3 lg:grid-cols-[10.5rem_minmax(0,1fr)] lg:rounded-none lg:bg-transparent lg:px-8 lg:shadow-none lg:backdrop-blur-none lg:supports-[backdrop-filter]:bg-transparent xl:grid-cols-[10.5rem_minmax(0,44rem)_13rem] xl:gap-10">
          <Link
            href="/"
            className="group inline-flex h-8 min-w-0 items-center gap-2 rounded-full px-1 text-[13px] font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-0"
          >
            <BrandLogo
              priority
              iconClassName="h-6 w-6 transition-opacity group-hover:opacity-82"
            />
            <span className="text-foreground/88 transition-colors group-hover:text-foreground">
              Help
            </span>
          </Link>

          <div className="flex items-center justify-end gap-1.5 xl:col-start-3 xl:justify-start">
            <Link
              href="/"
              className="inline-flex h-8 shrink-0 items-center rounded-full bg-foreground px-3 text-[12px] font-semibold text-background transition-transform hover:bg-foreground/92 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open app
            </Link>
            <HelpMobileMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        {children}
      </div>
    </main>
  );
}
