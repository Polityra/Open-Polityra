"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { GitBranch, Menu, X } from "lucide-react";

import { REPO_URL } from "@/lib/site";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-[1100] w-full border-b border-black/10 bg-white">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8"
      >
        <Link href="/" aria-label="Open Polityra home" className="flex items-center">
          <Image
            src="/images/logo-dark.png"
            alt="Open Polityra"
            width={1040}
            height={312}
            priority
            className="h-9 w-auto"
          />
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="ml-3">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              <GitBranch className="h-4 w-4" />
              GitHub
            </a>
          </li>
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-md p-2 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-black md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-black/10 bg-white px-6 pb-6 pt-2 md:hidden"
        >
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md py-3 text-base text-neutral-600 transition-colors hover:text-black"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <GitBranch className="h-4 w-4" />
            GitHub
          </a>
        </div>
      )}
    </header>
  );
}
