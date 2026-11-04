import Image from "next/image";
import Link from "next/link";
import { Github } from "lucide-react";
import { REPO_URL } from "@/lib/site";

const columns = [
  {
    title: "Platform",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/research", label: "Research Areas" },
      { href: "/methodology", label: "Methodology" },
    ],
  },
  {
    title: "Governance",
    links: [
      { href: "/about", label: "About & Mission" },
      { href: "/governance", label: "Governance Docs" },
      { href: "/contributing", label: "Contributing" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: REPO_URL, label: "GitHub", external: true },
      { href: "#", label: "Code of Conduct" },
      { href: "#", label: "Roadmap" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/licenses", label: "Licenses" },
      { href: "/citation", label: "Citation" },
    ],
  },
];

const linkClass = "text-[#74829f] transition-colors hover:text-[#41cbfd]";

export default function Footer() {
  return (
    <footer className="relative border-t border-[#12306a]/70 bg-[#000610]">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#41cbfd]/50 to-transparent"
      />
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-12 mt-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <Link href="/" aria-label="Open Polityra home">
              <Image
                src="/images/logo-transparent.png"
                alt="Open Polityra"
                width={80}
                height={62}
                className="h-auto w-44"
              />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#9aa8c7]">
              Open knowledge. Strategic understanding.{" "}
              <span className="text-[#349cf4]">Better futures.</span>
            </p>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 mb-6 inline-flex items-center gap-2 rounded-lg border border-[#41cbfd]/30 px-3.5 py-2 text-sm font-medium text-[#eef2fc] transition-colors hover:bg-white/5"
            >
              <Github className="h-4 w-4" /> Star on GitHub
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-display text-sm font-semibold text-white">{col.title}</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {"external" in l && l.external ? (
                        <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                          {l.label}
                        </a>
                      ) : (
                        <Link href={l.href} className={linkClass}>
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[#12306a]/70 pt-8 text-sm text-[#74829f] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Open Polityra. Licensed under Apache 2.0.</p>
          <p className="font-mono text-xs uppercase tracking-wider">Open source · Auditable · Independent</p>
        </div>
      </div>
    </footer>
  );
}
