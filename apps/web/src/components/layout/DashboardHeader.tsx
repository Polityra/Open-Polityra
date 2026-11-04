"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Menu,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";

interface DashboardHeaderProps {
  userMenu?: React.ReactNode;
  mobileMenu?: (closeMenu: () => void) => React.ReactNode;
}

export default function DashboardHeader({
  userMenu,
  mobileMenu,
}: DashboardHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function closePanels() {
    setSearchOpen(false);
    setMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] block h-16 w-full min-w-0 border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0b1728]">
      <div className="flex h-full w-full min-w-0 items-center justify-between gap-3 px-4 sm:px-6">


        <Link
          href="/dashboard"
          aria-label="Open Polityra dashboard"
          className="flex shrink-0 items-center"
        >
          <Image
            src="/images/logo-transparent.png"
            alt="Open Polityra"
            width={1040}
            height={312}
            priority
            className="h-9 w-auto"
          />
        </Link>

        {/* Desktop Search */}
        <div className="mx-6 hidden min-w-0 max-w-xl flex-1 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Search"
              placeholder="Search sources, reports, analyses..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-[#14263c] dark:text-white"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen(!searchOpen);
              setMenuOpen(false);
            }}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
          >
            {searchOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
          </button>

          {userMenu && (
            <div className="hidden border-l border-slate-200 pl-3 dark:border-slate-700 lg:block">
              {userMenu}
            </div>
          )}

          {mobileMenu && (
            <button
              type="button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen(!menuOpen);
                setSearchOpen(false);
              }}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      {searchOpen && (
        <div className="w-full border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#0b1728] md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Search sources, reports, and analyses"
              placeholder="Search sources, reports, analyses..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none dark:border-slate-700 dark:bg-[#14263c] dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      {menuOpen && mobileMenu && (
        <div className="max-h-[calc(100dvh-64px)] w-full overflow-y-auto border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#0b1728] lg:hidden">
         {userMenu && (
            <div className="mb-4 border-b border-slate-200 pb-4 dark:border-slate-700 lg:hidden">
              {userMenu}
            </div>
          )}

          {mobileMenu(closePanels)}
        </div>
      )}
    </header>
  );
}
