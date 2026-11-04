"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Menu, Search, X } from "lucide-react";

interface AppHeaderProps {
  renderUserMenu?: () => React.ReactNode;
  renderMobileMenu?: (closeMenu: () => void) => React.ReactNode;
}

const iconBtn =
  "rounded-lg p-2 text-[#9aa8c7] transition hover:bg-white/5 hover:text-[#eef2fc]";
const searchInput =
  "h-10 w-full rounded-lg border border-[#12306a] bg-[#061230] pl-10 pr-4 text-sm text-[#eef2fc] outline-none transition placeholder:text-[#74829f] focus:border-[#1478fd] focus:ring-2 focus:ring-[#1478fd]/30";

export function AppHeader({
  renderUserMenu,
  renderMobileMenu,
}: AppHeaderProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  function closeMobilePanels() {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-[1000] box-border w-screen max-w-none border-b border-[#12306a]/70 bg-[#000610]/85 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/dashboard"
          onClick={closeMobilePanels}
          aria-label="Open Polityra dashboard"
          className="flex shrink-0 items-center"
        >
          <Image
            src="/images/logo-transparent.png"
            alt="Open Polityra"
            width={80}
            height={62}
            priority
            className="h-9 w-auto"
          />
        </Link>

        {/* Desktop Search */}
        <div className="mx-auto hidden w-full max-w-xl px-8 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74829f]" />
            <input
              type="search"
              aria-label="Search"
              placeholder="Search sources, reports, analyses..."
              className={searchInput}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            aria-label={mobileSearchOpen ? "Close search" : "Open search"}
            aria-expanded={mobileSearchOpen}
            onClick={() => {
              setMobileSearchOpen((open) => !open);
              setMobileMenuOpen(false);
            }}
            className={`${iconBtn} md:hidden`}
          >
            {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          <button type="button" aria-label="Notifications" className={`relative ${iconBtn}`}>
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#41cbfd] shadow-[0_0_6px_#41cbfd]" />
          </button>

          {renderUserMenu && (
            <div className="hidden border-l border-[#12306a] pl-3 sm:block">{renderUserMenu()}</div>
          )}

          {renderMobileMenu && (
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => {
                setMobileMenuOpen((open) => !open);
                setMobileSearchOpen(false);
              }}
              className={`${iconBtn} lg:hidden`}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="w-full border-t border-[#12306a]/70 px-4 py-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74829f]" />
            <input
              type="search"
              placeholder="Search sources, reports, analyses..."
              aria-label="Search sources, reports, and analyses"
              className={searchInput}
            />
          </div>
        </div>
      )}

      {mobileMenuOpen && renderMobileMenu && (
        <div className="max-h-[calc(100dvh-4rem)] w-full overflow-y-auto border-t border-[#12306a]/70 bg-[#000610] px-4 py-4 lg:hidden">
          {renderUserMenu && (
            <div className="mb-4 border-b border-[#12306a]/70 pb-4 sm:hidden">{renderUserMenu()}</div>
          )}
          {renderMobileMenu(closeMobilePanels)}
        </div>
      )}
    </header>
  );
}
