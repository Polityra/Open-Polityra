"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Globe2,
  Shield,
  Layers,
  GitBranch,
  Brain,
  FileText,
  Bookmark,
  Settings,
  Sparkles,
  Newspaper,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/economy", label: "Economy", icon: BarChart3 },
  { href: "/dashboard/news", label: "World News", icon: Newspaper },
  { href: "/dashboard/geopolitics", label: "Geopolitics", icon: Globe2 },
  { href: "/dashboard/security", label: "Security", icon: Shield },
  { href: "/dashboard/resilience", label: "Resilience", icon: Layers },
  { href: "/dashboard/scenarios", label: "Scenarios", icon: GitBranch },
  { href: "/dashboard/forecasting", label: "Forecasting", icon: Brain },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/sources", label: "Sources", icon: Bookmark },
  { href: "/ai-workflow", label: "AI Workflows", icon: Sparkles, separator: false },
];

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const itemClass = (active: boolean, pad: string) =>
    `flex items-center gap-3 rounded-lg px-3 ${pad} text-sm font-medium transition-colors ${
      active
        ? "bg-black text-white shadow-gray/20 shadow-sm"
        : "text-black/80 hover:bg-black/10 hover:text-black"
    }`;

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && !!pathname?.startsWith(href));

  if (mobile) {
    return (
      <nav aria-label="Mobile navigation" className="space-y-1">
        {navItems.map(({ href, label, icon: Icon, separator }) =>
          separator ? (
            <div key="separator" className="my-4 border-t border-black/20" />
          ) : (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={itemClass(isActive(href), "py-3")}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ),
        )}
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className={itemClass(pathname === "/dashboard/settings", "py-3")}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </nav>
    );
  }

  return (
    <aside className="fixed left-0 top-16 bottom-0 z-40 hidden w-64 flex-col overflow-hidden border-r border-gray-200 bg-white py-6 lg:flex">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <nav className="space-y-1 px-4">
          {navItems.map(({ href, label, icon: Icon, separator }) =>
            separator ? (
              <div key="separator" className="my-4 border-t border-black/20" />
            ) : (
              <Link key={href} href={href} className={itemClass(isActive(href), "py-2")}>
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            ),
          )}
        </nav>
      </div>

      {/* Always pinned to the bottom */}
      <div className="mt-auto shrink-0 border-t border-black/20 px-4 pt-4">
        <nav>
          <Link
            href="/dashboard/settings"
            className={itemClass(pathname === "/dashboard/settings", "py-2")}
          >
            <Settings className="h-5 w-5 shrink-0" />
            Settings
          </Link>
        </nav>
      </div>
    </aside>
  );
}
