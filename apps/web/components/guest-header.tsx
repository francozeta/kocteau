import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GuestHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-border/25 bg-background/72 backdrop-blur-xl">
      <div className="mx-auto flex h-15 max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="inline-flex items-center rounded-full px-2 py-1"
          aria-label="Go to feed"
        >
          <BrandLogo priority iconClassName="h-[1.35rem] w-[1.35rem]" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-10 rounded-full border border-border/30 bg-background/55 px-3.5 text-muted-foreground hover:bg-muted/26 hover:text-foreground",
            )}
          >
            Explore
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-full border-border/30 px-4 text-foreground",
            )}
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}
