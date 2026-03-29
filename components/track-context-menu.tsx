"use client";

import type { ReactNode } from "react";
import { CornerUpRight, MessageSquarePlus, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toastActionError, toastActionSuccess } from "@/lib/feedback";

type TrackContextMenuProps = {
  href: string;
  title: string;
  artistName?: string | null;
  composeHref?: string | null;
  children: ReactNode;
};

export default function TrackContextMenu({
  href,
  title,
  artistName = null,
  composeHref = null,
  children,
}: TrackContextMenuProps) {
  const router = useRouter();

  async function handleShare() {
    try {
      const shareUrl = new URL(href, window.location.origin).toString();
      const shareLabel = artistName?.trim() ? `${title} — ${artistName}` : title;

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: shareLabel,
            text: shareLabel,
            url: shareUrl,
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toastActionSuccess("Track link copied");
        return;
      }

      throw new Error("Sharing isn't available on this device right now.");
    } catch (error) {
      toastActionError(error, "We couldn't share this track right now.");
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent className="w-48 rounded-xl border-border/30 bg-popover/96 p-1.5 shadow-xl">
        <ContextMenuLabel>Track</ContextMenuLabel>
        <ContextMenuItem
          onSelect={() => {
            router.prefetch(href);
            router.push(href);
          }}
        >
          <CornerUpRight className="size-4" />
          Open track
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            void handleShare();
          }}
        >
          <Share2 className="size-4" />
          Share track
        </ContextMenuItem>

        {composeHref ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() => {
                router.prefetch(composeHref);
                router.push(composeHref);
              }}
            >
              <MessageSquarePlus className="size-4" />
              Write review
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
