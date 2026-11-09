"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, Search, X } from "lucide-react";
import Image from "next/image";

interface DashboardHeaderProps {
  userMenu?: React.ReactNode;
  mobileMenu?: (closeMenu: () => void) => React.ReactNode;
}

export default function DashboardHeader({ userMenu, mobileMenu }: DashboardHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function closePanels() {
    setSearchOpen(false);
    setMenuOpen(false);
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-200";

  const iconButtonClass =
    "rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900";

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] block h-16 w-full min-w-0 border-b border-neutral-200 bg-white">
      <div className="flex h-full w-full min-w-0 items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Open Polityra dashboard" className="flex shrink-0 items-center">
          <Image
            src="/images/logo-dark.png"
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              aria-label="Search"
              placeholder="Search sources, reports, analyses..."
              className={inputClass}
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
            className={`${iconButtonClass} md:hidden`}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className={`relative ${iconButtonClass}`}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-neutral-900" />
          </button>

          {userMenu && (
            <div className="hidden border-l border-neutral-200 pl-3 lg:block">{userMenu}</div>
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
              className={`${iconButtonClass} lg:hidden`}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      {searchOpen && (
        <div className="w-full border-t border-neutral-200 bg-white p-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              aria-label="Search sources, reports, and analyses"
              placeholder="Search sources, reports, analyses..."
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      {menuOpen && mobileMenu && (
        <div className="max-h-[calc(100dvh-64px)] w-full overflow-y-auto border-t border-neutral-200 bg-white p-4 lg:hidden">
          {userMenu && (
            <div className="mb-4 border-b border-neutral-200 pb-4 lg:hidden">{userMenu}</div>
          )}

          {mobileMenu(closePanels)}
        </div>
      )}
    </header>
  );
}
