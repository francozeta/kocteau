"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List } from "@/components/ui/icons";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { helpDocuments } from "@/lib/help";
import { cn } from "@/lib/utils";

export default function HelpMobileMenu() {
  const pathname = usePathname();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label="Open help menu"
          className="inline-flex size-8 items-center justify-center rounded-full bg-foreground/[0.075] text-foreground/86 transition-colors hover:bg-foreground/[0.11] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <List size={17} weight="bold" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="lg:hidden before:rounded-[1.1rem] before:border-[var(--kocteau-line-soft)] before:bg-[var(--kocteau-surface)] data-[vaul-drawer-direction=bottom]:max-h-[72vh]">
        <DrawerHeader className="px-4 pb-2 pt-5 text-left">
          <DrawerTitle className="font-sans text-[15px] font-semibold">
            Help
          </DrawerTitle>
          <DrawerDescription className="text-[13px] text-muted-foreground/68">
            Kocteau notes and policies.
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-1 px-2 pb-3">
          {helpDocuments.map((document) => {
            const isActive = pathname === document.href;

            return (
              <DrawerClose key={document.slug} asChild>
                <Link
                  href={document.href}
                  className={cn(
                    "flex min-h-11 items-center justify-between rounded-[0.82rem] px-3 text-[14px] font-medium text-muted-foreground/78 outline-none transition-colors hover:bg-foreground/[0.045] focus-visible:bg-foreground/[0.07]",
                    isActive && "bg-foreground/[0.075] text-foreground",
                  )}
                >
                  <span>{document.label}</span>
                  <span className="rounded-full border border-[var(--kocteau-line-soft)] px-2 py-0.5 text-[11px] leading-none text-muted-foreground/52">
                    {document.section}
                  </span>
                </Link>
              </DrawerClose>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
