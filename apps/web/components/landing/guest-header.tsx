import Link from "next/link";
import BrandLogo from "@/components/brand/brand-logo";
import ProgressiveMobileHeaderBlur from "@/components/shell/progressive-mobile-header-blur";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GuestHeader() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-20 hidden h-20 bg-[linear-gradient(to_bottom,var(--kocteau-landing-canvas)_0%,color-mix(in_oklch,var(--kocteau-landing-canvas)_72%,transparent)_52%,transparent_100%)] md:block"
      />
      <header className="kocteau-guest-typography fixed inset-x-0 top-0 z-30">
        <ProgressiveMobileHeaderBlur canvas="landing" />
        <div className="relative z-10 flex h-12 w-full translate-y-[5px] items-center justify-between px-4 sm:h-16 sm:translate-y-0 sm:px-6">
          <Link
            href="/"
            className="-m-2 inline-flex items-center rounded-full p-2 transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
            aria-label="Kocteau home"
          >
            <BrandLogo priority iconClassName="size-5 sm:size-[1.35rem]" />
          </Link>

          <nav
            aria-label="Guest navigation"
            className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3 sm:gap-5"
          >
            <Link
              href="/"
              aria-current="page"
              className="hidden font-circular text-[12px] font-medium leading-5 text-foreground transition-colors duration-150 sm:block sm:text-[13px]"
            >
              Home
            </Link>
            <Link
              href="/search"
              className="font-circular text-[12px] font-medium leading-5 text-muted-foreground/68 transition-colors duration-150 hover:text-foreground sm:text-[13px]"
            >
              Explore
            </Link>
            <Link
              href="/reviews"
              className="font-circular text-[12px] font-medium leading-5 text-muted-foreground/68 transition-colors duration-150 hover:text-foreground sm:text-[13px]"
            >
              Reviews
            </Link>
          </nav>

          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "h-8 rounded-full border-0 px-2.5 font-circular text-[12px] font-medium shadow-none sm:px-3 sm:text-[13px]",
            )}
          >
            Log in
          </Link>
        </div>
      </header>
    </>
  );
}
