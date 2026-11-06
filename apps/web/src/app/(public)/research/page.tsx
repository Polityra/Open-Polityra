import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Activity,
  BarChart3,
  Building2,
  Globe2,
  Ship,
  Shield,
} from "lucide-react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import { createPageMetadata, REPO_URL } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Research Areas: Economics, Security and More",
  description:
    "Explore Open Polityra's research areas, including economics and public finance, geopolitics, security and cybersecurity, resilience, public services, and international trade.",
  path: "/research",
});

const areas = [
  {
    icon: BarChart3,
    number: "01",
    title: "Economics & public finance",
    description:
      "Explore public economic data, fiscal indicators, and transparent scenario calculations.",
    focus: ["Fiscal balance", "Public data", "Scenario assumptions"],
    href: "/dashboard/economy",
    status: "Working prototype",
  },
  {
    icon: Globe2,
    number: "02",
    title: "Geopolitics",
    description:
      "A research scope for examining international developments, institutions, and relationships through public information.",
    focus: ["International affairs", "Institutions", "Public reporting"],
    href: "/dashboard/geopolitics",
    status: "Exploratory dashboard",
  },
  {
    icon: Shield,
    number: "03",
    title: "Security & cyber",
    description:
      "Follow configured public reporting on security topics, with publisher attribution and clear verification caveats.",
    focus: ["Security news", "Cybersecurity", "Source context"],
    href: "/dashboard/news",
    status: "News monitor",
  },
  {
    icon: Activity,
    number: "04",
    title: "Resilience",
    description:
      "Consider how public services, infrastructure, and connected systems may respond to disruption.",
    focus: ["System resilience", "Infrastructure", "Public information"],
    href: "/dashboard/resilience",
    status: "Exploratory dashboard",
  },
  {
    icon: Building2,
    number: "05",
    title: "Public services",
    description:
      "A research direction focused on service capacity, access, and outcomes using documented public evidence.",
    focus: ["Service delivery", "Capacity", "Outcomes"],
    href: `${REPO_URL}/tree/main/research/domains/public-services`,
    status: "Research scope",
    external: true,
  },
  {
    icon: Ship,
    number: "06",
    title: "International trade",
    description:
      "A research direction on trade patterns, supply chains, and how external shocks can affect connected economies.",
    focus: ["Trade flows", "Supply chains", "Disruptions"],
    href: `${REPO_URL}/tree/main/research/domains`,
    status: "Research scope",
    external: true,
  },
];

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-[#050a12] text-[#eef2fc]">
      <Navbar />
      <main>
        <section className="relative isolate overflow-hidden border-b border-white/[0.08] px-6 pb-16 pt-36 sm:pb-20 sm:pt-40">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_55%_0%,rgba(20,120,253,0.2),transparent_60%)]"
          />
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">
              Research areas
            </p>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <h1 className="max-w-3xl font-display text-4xl font-light leading-[1.1] tracking-tight text-white sm:text-6xl">
                Many systems.
                <br />
                <span className="text-cyan-200">One connected world.</span>
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                The project organizes its research around connected public questions. These are
                focus areas—not a claim that complete datasets, analysis, or tools already exist for
                every domain.
              </p>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/methodology"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white"
              >
                How we approach research <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={`${REPO_URL}/tree/main/research/domains`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Browse domain notes <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                Current and emerging work
              </p>
              <h2 className="mt-4 font-display text-3xl font-light text-white sm:text-4xl">
                Research map
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              Each area has a different maturity level. Follow the status label to understand what
              is available today.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {areas.map(
              ({ icon: Icon, number, title, description, focus, href, status, external }) => {
                const content = (
                  <>
                    <div className="flex items-start justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-200/15 bg-cyan-200/[0.06] text-cyan-200">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-mono text-xs text-slate-600">{number}</span>
                    </div>
                    <h3 className="mt-7 font-display text-xl font-medium text-white">{title}</h3>
                    <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-slate-400">
                      {description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {focus.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-7 flex items-center justify-between border-t border-white/[0.08] pt-4">
                      <span className="text-xs font-medium text-cyan-200/80">{status}</span>
                      <ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-200" />
                    </div>
                  </>
                );
                return external ? (
                  <a
                    key={number}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-2xl border border-white/[0.08] bg-[#0a1422] p-6 transition hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-[#0c1929] sm:p-7"
                  >
                    {content}
                  </a>
                ) : (
                  <Link
                    key={number}
                    href={href}
                    className="group rounded-2xl border border-white/[0.08] bg-[#0a1422] p-6 transition hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-[#0c1929] sm:p-7"
                  >
                    {content}
                  </Link>
                );
              },
            )}
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-[#080f1b]">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-200">
                How to read this page
              </p>
              <h2 className="mt-4 font-display text-3xl font-light text-white">
                Scope is not the same as capability.
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-7 text-slate-400">
              <p>
                Some dashboard areas are early interface explorations. The Finland fiscal-balance
                work is the clearest end-to-end research prototype in the repository; the public
                news monitor only collects configured publisher feeds and does not independently
                verify their claims.
              </p>
              <p>
                All outputs can be incomplete or wrong. They are for research and exploration, not
                official decisions or a substitute for expert review.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 font-medium text-cyan-200 hover:text-white"
              >
                About the project <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
