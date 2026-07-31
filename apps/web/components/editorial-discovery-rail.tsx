"use client";

import PrefetchLink from "@/components/prefetch-link";
import { useSecondaryRailContent } from "@/components/secondary-rail-context";
import { helpFooterLinks } from "@/lib/help";

const railFooterLinks = [
  ...helpFooterLinks,
  {
    href: "https://github.com/francozeta/kocteau",
    label: "GitHub",
  },
  {
    href: "https://discord.gg/FgrNjkPa8",
    label: "Discord",
  },
] as const;

export default function EditorialDiscoveryRail() {
  const customRailContent = useSecondaryRailContent();

  return (
    <aside className="hidden lg:block lg:min-h-0" aria-label="Context rail">
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {customRailContent}
        </div>

        <footer className="mt-4 px-1 pb-8 pt-1 text-[11px] leading-5 text-muted-foreground/52">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {railFooterLinks.map((link) => {
              const isExternal = link.href.startsWith("http");

              return (
                <PrefetchLink
                  key={link.href}
                  href={link.href}
                  prefetch={!isExternal}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  className="transition-colors hover:text-muted-foreground"
                >
                  {link.label}
                </PrefetchLink>
              );
            })}
          </div>
          <p>© 2026 Kocteau</p>
        </footer>
      </div>
    </aside>
  );
}
