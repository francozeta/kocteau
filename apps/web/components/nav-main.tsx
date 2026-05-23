"use client";

import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
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
                <SidebarMenuBadge>{item.badge > 99 ? "99+" : item.badge}</SidebarMenuBadge>
              ) : null}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
