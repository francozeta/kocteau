import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GuestHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.055] bg-[var(--kocteau-shell)]">
      <div className="mx-auto flex h-15 w-full max-w-[80rem] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="-m-2 inline-flex items-center rounded-full p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          aria-label="Kocteau home"
        >
          <BrandLogo priority iconClassName="h-[1.35rem] w-[1.35rem]" />
        </Link>

        <nav aria-label="Guest navigation" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/reviews"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden h-10 rounded-full px-3.5 text-muted-foreground hover:bg-white/[0.055] hover:text-foreground sm:inline-flex",
            )}
          >
            Reviews
          </Link>
          <Link
            href="/search"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-10 rounded-full px-3.5 text-muted-foreground hover:bg-white/[0.055] hover:text-foreground",
            )}
          >
            Explore
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "h-10 rounded-full border-0 bg-foreground px-4 text-background shadow-none hover:bg-foreground/90 hover:text-background",
            )}
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
