"use client";

import Link from "next/link";
import type { Icon } from "@/components/ui/icons";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { sidebarPrimaryNavButtonClassName } from "@/components/sidebar-nav-styles";

type NavMainItem = {
  title: string;
  url: string;
  icon: Icon;
  isActive?: boolean;
  badge?: number | null;
  external?: boolean;
};

export function NavMain({
  items,
  onNavigate,
}: {
  items: NavMainItem[];
  onNavigate?: () => void;
}) {
  return (
    <SidebarGroup className="px-0">
      <SidebarGroupLabel>Browse</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={item.isActive}
                tooltip={item.title}
                size="lg"
                className={sidebarPrimaryNavButtonClassName}
              >
                {item.external ? (
                  <a href={item.url} target="_blank" rel="noreferrer" onClick={onNavigate}>
                    <item.icon weight={item.isActive ? "fill" : "regular"} />
                    <span className="kocteau-sidebar-label">{item.title}</span>
                  </a>
                ) : (
                  <Link href={item.url} onClick={onNavigate}>
                    <item.icon weight={item.isActive ? "fill" : "regular"} />
                    <span className="kocteau-sidebar-label">{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
              {item.badge && item.badge > 0 ? (
                <SidebarMenuBadge
                  role="status"
                  aria-label={`${item.badge} unread`}
                  className="right-2 !h-1.5 !w-1.5 !min-w-[0.375rem] rounded-full bg-sidebar-foreground/72 !p-0 text-transparent shadow-[0_0_0_2px_var(--sidebar)] peer-data-active/menu-button:bg-sidebar-foreground"
                />
              ) : null}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
