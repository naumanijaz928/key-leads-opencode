import {
  Activity,
  Briefcase,
  Building,
  Database,
  Funnel,
  LayoutDashboard,
  Play,
  ScrollText,
  Settings,
  ShieldCheck,
  Upload,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Leads", href: "/leads", icon: Briefcase },
      { label: "Companies", href: "/companies", icon: Building },
      { label: "Runs", href: "/runs", icon: Play },
      { label: "Import", href: "/import", icon: Upload },
      {
        label: "Searches",
        href: "/searches",
        icon: Funnel,
        roles: ["super_admin", "team_admin"],
      },
      {
        label: "Sources",
        href: "/sources",
        icon: Database,
        roles: ["super_admin", "team_admin"],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Teams",
        href: "/admin/teams",
        icon: Users,
        roles: ["super_admin", "team_admin"],
      },
      {
        label: "Access",
        href: "/admin/access",
        icon: ShieldCheck,
        roles: ["super_admin"],
      },
      {
        label: "Session logs",
        href: "/admin/sessions",
        icon: Activity,
        roles: ["super_admin", "team_admin"],
      },
      {
        label: "Action logs",
        href: "/admin/actions",
        icon: ScrollText,
        roles: ["super_admin", "team_admin"],
      },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function visibleNavGroups(role: Role): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}
