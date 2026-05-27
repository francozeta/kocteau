"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SiV0 } from "react-icons/si";
import { Check, Copy } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { toastActionError } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type CreatorPerksCardProps = {
  unlockedAt: string;
  v0ReferralUrl: string | null;
  canOpenReferral?: boolean;
  isAuthenticated?: boolean;
  className?: string;
};

function formatUnlockedAt(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDisplayUrl(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function CreatorBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-[999px] border-foreground/16 bg-foreground/[0.04] px-2.5 text-[0.68rem] text-foreground/86",
        className,
      )}
    >
      {children}
    </Badge>
  );
}

function CreatorBadges() {
  return (
    <div className="flex flex-wrap gap-2">
      <CreatorBadge>First Reviewer</CreatorBadge>
      <CreatorBadge className="gap-1.5">
        <SiV0 className="size-3" />
        v0 Builder
      </CreatorBadge>
    </div>
  );
}

function DialogArtwork() {
  return (
    <div className="flex min-h-[12rem] items-center justify-center bg-[var(--kocteau-canvas)]">
      <div className="flex size-[3.75rem] items-center justify-center rounded-[0.95rem] bg-[var(--kocteau-surface-control)] shadow-[0_0_0_1px_var(--kocteau-line),inset_0_1px_0_var(--kocteau-topline)]">
        <SiV0 className="size-8 text-foreground" />
      </div>
    </div>
  );
}

function ReferralLinkBlock({
  copied,
  displayUrl,
  v0ReferralUrl,
  onCopy,
}: {
  copied: boolean;
  displayUrl: string | null;
  v0ReferralUrl: string | null;
  onCopy: () => void;
}) {
  const shownUrl = v0ReferralUrl ?? displayUrl ?? "Referral link not configured";

  return (
    <div className="rounded-[0.88rem] bg-[var(--kocteau-surface-raised)] p-3 shadow-[0_0_0_1px_var(--kocteau-line-soft)]">
      <p className="text-[11px] font-medium leading-none text-muted-foreground">
        Share your link
      </p>
      <div className="mt-2 grid h-11 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 rounded-[0.66rem] bg-[var(--kocteau-canvas)] p-1.5 shadow-[inset_0_0_0_1px_var(--kocteau-line)]">
        <p className="min-w-0 truncate pl-2 pr-1 font-mono text-[11px] font-medium leading-none text-foreground/92">
          {shownUrl}
        </p>
        <Button
          type="button"
          onClick={onCopy}
          disabled={!v0ReferralUrl}
          className="h-8 w-[5.15rem] shrink-0 gap-1.5 rounded-[0.48rem] bg-foreground px-2.5 text-xs text-background transition-[background-color,color,transform] hover:bg-foreground/90 active:scale-[0.96] disabled:opacity-55"
        >
          <span className="relative size-3.5 shrink-0">
            <Copy
              className={cn(
                "absolute inset-0 size-3.5 transition-[opacity,scale,filter] duration-200 ease-out",
                copied ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-0",
              )}
            />
            <Check
              className={cn(
                "absolute inset-0 size-3.5 transition-[opacity,scale,filter] duration-200 ease-out",
                copied ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]",
              )}
            />
          </span>
          <span className="w-10 text-left">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
    </div>
  );
}

function OwnerBody({
  copied,
  displayUrl,
  v0ReferralUrl,
  onCopy,
}: {
  copied: boolean;
  displayUrl: string | null;
  v0ReferralUrl: string | null;
  onCopy: () => void;
}) {
  return (
    <ReferralLinkBlock
      copied={copied}
      displayUrl={displayUrl}
      v0ReferralUrl={v0ReferralUrl}
      onCopy={onCopy}
    />
  );
}

function GuestBody({
  isAuthenticated,
  unlockedLabel,
}: {
  isAuthenticated: boolean;
  unlockedLabel: string;
}) {
  const reviewHref = isAuthenticated ? "/?compose=1" : "/login?next=%2F%3Fcompose%3D1";
  const actionLabel = isAuthenticated ? "Review a track" : "Sign in to review";

  return (
    <>
      <p className="text-pretty text-sm leading-5 text-foreground">
        This badge marks a listener who published an early Kocteau review. It
        is public; the invite behind it belongs to the profile owner.
      </p>
      <div className="space-y-2">
        <CreatorBadges />
        <p className="text-xs leading-5 text-muted-foreground">Added {unlockedLabel}</p>
      </div>
      <Button
        asChild
        className="h-9 w-full rounded-[var(--kocteau-radius-control)] bg-foreground text-background hover:bg-foreground/90"
      >
        <Link href={reviewHref}>{actionLabel}</Link>
      </Button>
    </>
  );
}

export default function CreatorPerksCard({
  unlockedAt,
  v0ReferralUrl,
  canOpenReferral = false,
  isAuthenticated = false,
  className,
}: CreatorPerksCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const isMobile = useIsMobile();
  const unlockedLabel = useMemo(() => formatUnlockedAt(unlockedAt), [unlockedAt]);
  const displayUrl = v0ReferralUrl ? getDisplayUrl(v0ReferralUrl) : null;
  const title = canOpenReferral ? "v0 Builder" : "v0 Builder badge";
  const description = canOpenReferral
    ? "Your first review unlocked this private invite."
    : "A public mark for early Kocteau reviewers.";

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  async function copyReferralLink() {
    if (!v0ReferralUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(v0ReferralUrl);
      setCopied(true);

      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetTimeoutRef.current = null;
      }, 1800);
    } catch (error) {
      toastActionError(error, "We couldn't copy the v0 referral link right now.");
    }
  }

  const body = canOpenReferral ? (
    <OwnerBody
      copied={copied}
      displayUrl={displayUrl}
      v0ReferralUrl={v0ReferralUrl}
      onCopy={() => void copyReferralLink()}
    />
  ) : (
    <GuestBody isAuthenticated={isAuthenticated} unlockedLabel={unlockedLabel} />
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className={cn(
          "h-9 w-9 shrink-0 rounded-[var(--kocteau-radius-control)] border-border/42 bg-[var(--kocteau-surface-control)] text-foreground shadow-[0_0_0_1px_var(--kocteau-line-soft)] hover:bg-[var(--kocteau-surface-control-hover)] hover:text-foreground focus-visible:ring-1 focus-visible:ring-foreground/24",
          className,
        )}
        aria-label={canOpenReferral ? "Open v0 Builder perk" : "Open v0 Builder badge"}
      >
        <SiV0 className="size-[17px]" />
      </Button>

      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="overflow-hidden rounded-t-[1.05rem] border-border/35 bg-[var(--kocteau-surface)] p-0 text-foreground before:hidden [&>div:first-child]:hidden">
            <DialogArtwork />
            <div className="border-t border-border/20 bg-[var(--kocteau-surface)]">
              <DrawerHeader className="gap-2 px-4 pt-4 pb-2 text-left">
                <DrawerTitle className="font-heading text-base font-semibold leading-6">
                  {title}
                </DrawerTitle>
                <DrawerDescription className="text-pretty text-sm leading-5">
                  {description}
                </DrawerDescription>
              </DrawerHeader>

              <div className="space-y-4 px-4 pb-2">{body}</div>

              <DrawerFooter className="p-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-[0.75rem] border-border/35 bg-transparent hover:bg-foreground/[0.04]"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            showCloseButton={false}
            className="max-w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-[1.05rem] border-border/35 bg-[var(--kocteau-surface)] p-0 text-foreground shadow-[0_24px_80px_rgba(0,0,0,0.58)]"
          >
            <DialogArtwork />

            <div className="flex flex-col gap-4 border-t border-border/20 bg-[var(--kocteau-surface)] p-4">
              <DialogHeader className="gap-2 text-left">
                <DialogTitle className="font-heading text-base font-semibold leading-6">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-pretty text-sm leading-5">
                  {description}
                </DialogDescription>
              </DialogHeader>

              {body}

              <DialogFooter className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full rounded-[0.75rem] border-border/35 bg-transparent hover:bg-foreground/[0.04]"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
