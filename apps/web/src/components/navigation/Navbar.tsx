"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Github, Menu, X } from "lucide-react";

import { REPO_URL } from "@/lib/site";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[1100] transition-colors duration-200 ${
        scrolled || open
          ? "border-b border-[#12306a]/70 bg-[#000610]/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8"
      >
        <Link href="/" aria-label="Open Polityra home" className="flex items-center">
          <Image
            src="/images/logo-transparent.png"
            alt="Open Polityra"
            width={80}
            height={62}
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
                className="rounded-md px-3 py-2 text-sm font-medium text-[#9aa8c7] transition-colors hover:text-[#eef2fc]"
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
              className="inline-flex items-center gap-2 rounded-lg bg-[#1478fd] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#0b5fd9] hover:shadow-[0_0_24px_rgba(20,120,253,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#41cbfd]"
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
          </li>
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-md p-2 text-[#eef2fc] md:hidden"
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
        <div id="mobile-menu" className="border-t border-[#12306a]/70 px-6 pb-6 pt-2 md:hidden">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-[#c4cfe6] hover:text-white"
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
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1478fd] px-4 py-3 text-sm font-semibold text-white"
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
        </div>
      )}
    </header>
  );
}
