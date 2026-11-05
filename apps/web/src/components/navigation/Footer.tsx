import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";
import { REPO_URL } from "@/lib/site";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/research", label: "Research areas" },
      { href: "/methodology", label: "Methods & standards" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "/about", label: "About" },
      { href: `${REPO_URL}/blob/main/ROADMAP.md`, label: "Roadmap", external: true },
      { href: `${REPO_URL}/blob/main/CONTRIBUTING.md`, label: "Contribute", external: true },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: `${REPO_URL}/blob/main/PRIVACY.md`, label: "Privacy", external: true },
      { href: `${REPO_URL}/blob/main/DATA_POLICY.md`, label: "Data policy", external: true },
      { href: `${REPO_URL}/blob/main/GOVERNANCE.md`, label: "Governance", external: true },
    ],
  },
];

const linkClass = "text-sm text-slate-400 transition-colors hover:text-cyan-200";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#03070d]">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1.8fr]">
          <div>
            <Link href="/" aria-label="Open Polityra home" className="inline-flex">
              <Image
                src="/images/logo-transparent.png"
                alt="Open Polityra"
                width={1040}
                height={312}
                className="h-auto w-44"
              />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Open-source research and software for examining complex public questions—with
              evidence, assumptions, and limitations in view.
            </p>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-200/30 hover:bg-white/[0.03]"
            >
              <Github className="h-4 w-4" /> Project repository{" "}
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  {column.title}
                </h2>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClass}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className={linkClass}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.08] pt-6 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Open Polityra is an early-stage, independent project—not an official public authority.
            Outputs require independent verification.
          </p>
          <p className="shrink-0 font-mono uppercase tracking-[0.12em]">
            Open source · Human accountable
          </p>
        </div>
      </div>
    </footer>
  );
}
