"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { List } from "@/components/ui/icons";
import {
  DrawerBase,
  DrawerBaseBackdrop,
  DrawerBaseBody,
  DrawerBaseContent,
  DrawerBaseDescription,
  DrawerBaseHandle,
  DrawerBaseHeader,
  DrawerBasePortal,
  DrawerBaseTitle,
  DrawerBaseTrigger,
  DrawerBaseViewport,
} from "@/components/ui/drawer-base";
import { helpDocuments } from "@/lib/help";
import { cn } from "@/lib/utils";
import styles from "./help-mobile-menu.module.css";

export default function HelpMobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };

    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [open]);

  return (
    <DrawerBase open={open} onOpenChange={setOpen}>
      <DrawerBaseTrigger
        type="button"
        aria-label="Open help menu"
        className="inline-flex size-8 items-center justify-center rounded-full bg-foreground/[0.075] text-foreground/86 transition-colors hover:bg-foreground/[0.11] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <List size={17} weight="bold" />
      </DrawerBaseTrigger>
      <DrawerBasePortal className={styles.portal}>
        <DrawerBaseBackdrop data-slot="drawer-overlay" className={styles.backdrop} />
        <DrawerBaseViewport className={styles.viewport}>
          <DrawerBaseContent
            className={cn("text-xs/relaxed text-sidebar-foreground lg:hidden", styles.popup)}
          >
            <DrawerBaseHandle
              aria-hidden="true"
              className="mt-2.5 h-[3px] w-20 shrink-0 bg-foreground/20 shadow-[0_0_0_1px_rgba(255,255,255,0.025)]"
            />
            <DrawerBaseBody className={styles.body}>
              <DrawerBaseHeader className="px-4 pb-2 pt-5 text-left">
                <DrawerBaseTitle className="font-sans text-[15px] font-semibold">
                  Help
                </DrawerBaseTitle>
                <DrawerBaseDescription className="text-[13px] text-muted-foreground/68">
                  Kocteau notes and policies.
                </DrawerBaseDescription>
              </DrawerBaseHeader>
              <div className="space-y-1 px-2 pb-3">
                {helpDocuments.map((document) => {
                  const isActive = pathname === document.href;

                  return (
                    <Link
                      key={document.slug}
                      href={document.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setOpen(false)}
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
                  );
                })}
              </div>
            </DrawerBaseBody>
          </DrawerBaseContent>
        </DrawerBaseViewport>
      </DrawerBasePortal>
    </DrawerBase>
  );
}
