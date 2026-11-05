import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  ArrowRight,
  Check,
  ChevronRight,
  Database,
  Globe2,
  HeartHandshake,
  Lightbulb,
  Shield,
  ShieldCheck,
  TrendingUp,
  Github,
  Users,
} from "lucide-react";
import { REPO_URL } from "@/lib/site";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
export const instant = false;

const researchAreas = [
  { icon: TrendingUp, title: "Economics", description: "Public finance, macroeconomic indicators, trade, and the assumptions behind each analysis.", href: "/dashboard/economy", status: "Prototype available" },
  { icon: Globe2, title: "Geopolitics", description: "A research scope for understanding international relationships, events, and competing perspectives.", href: "/dashboard/geopolitics", status: "Research area" },
  { icon: Shield, title: "Security", description: "Public-source context for security and cyber developments, with clear limits on what is verified.", href: "/dashboard/news", status: "Monitor available" },
  { icon: Activity, title: "Resilience", description: "Explore how interconnected systems respond to disruption and changing conditions.", href: "/dashboard/resilience", status: "Research area" },
];

const principles = [
  { icon: Database, title: "Trace every input", text: "Sources, retrieval dates, and data definitions belong beside the analysis—not hidden behind it." },
  { icon: Lightbulb, title: "Show the assumptions", text: "Separate observed data from estimates, scenarios, and interpretations." },
  { icon: HeartHandshake, title: "Keep people accountable", text: "Tools can inform decisions; responsibility remains with people and institutions." },
];

export default async function HomePage() {
  await connection();

  return (
    <div className="min-h-screen bg-[#000610] text-[#eef2fc]">
      <Navbar />
      {/* Hero — matches the Landing Page design */}
      <section className="relative isolate flex min-h-screen flex-col overflow-hidden">
        <Image
          src="/images/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-top"
        />
        {/* Fade the lower half into the page background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[#000610]/30 to-[#000610]" />

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 pt-32 text-center">


          <h1 className="font-display text-5xl font-light tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-6xl">
            Open Polityra - OpenSource
          </h1>
          <div className="mt-5 h-px w-full max-w-xl bg-gradient-to-r from-transparent via-[#41cbfd]/70 to-transparent" />



          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#c4cfe6] sm:text-lg">
            An open-source, AI-based analysis platform built for government and public-sector
            decision-makers. It turns geopolitical, economic, security and cyber data into
            transparent, verifiable insight.
          </p>

          <ul className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2 text-xs font-medium text-[#a3ecff] sm:text-sm">
            {[
              "Geopolitical stats",
              "Economic analysis",
              "National crisis",
              "Cyber threats",
              "International security",
            ].map((t) => (
              <li
                key={t}
                className="rounded-full border border-[#41cbfd]/25 bg-[#000610]/50 px-3 py-1 backdrop-blur"
              >
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#000610] shadow-sm transition-all hover:bg-[#eef2fc] hover:shadow-[0_0_28px_rgba(65,203,253,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#41cbfd]"
            >
              <Github className="h-5 w-5" /> Repository Source
            </a>
            <Link
              href="/research"
              className="inline-flex items-center gap-2 rounded-lg border border-[#41cbfd]/40 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              Explore research <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Logo, bottom-left */}
        <div className="px-6 pb-8 lg:px-8">
          <Image
            src="/images/logo-transparent.png"
            alt="Open Polityra"
            width={1040}
            height={312}
            className="h-auto w-48 sm:w-64"
          />
        </div>
      </section>

      <section className="relative border-y border-white/[0.07] bg-[#050d19]">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(20,120,253,0.12),transparent_65%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-3 sm:gap-0 lg:px-8">
          {[
            ["Open by design", "Code, methods, and assumptions are inspectable."],
            ["Evidence-led", "Public sources and traceable data ground the work."],
            ["Human accountable", "Analysis supports decisions; it never makes them."],
          ].map(([title, text], index) => (
            <div key={title} className={`px-0 sm:px-8 ${index > 0 ? "sm:border-l sm:border-white/10" : ""}`}>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">0{index + 1} / Principle</p>
              <h2 className="mt-3 font-display text-xl font-medium text-white">{title}</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">A connected view</p>
            <h2 className="mt-5 max-w-lg font-display text-4xl font-light leading-tight tracking-tight text-white sm:text-5xl">
              See the systems behind the headlines.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Open Polityra brings public information and transparent methods into one research
            workspace. Explore connected questions across economies, geopolitics, security, and resilience
            without confusing a model with the real world.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {researchAreas.map((area, index) => (
            <Link key={area.title} href={area.href} className="group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1422] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-[#0d1b2c]">
              <span className="absolute right-5 top-5 font-mono text-xs text-slate-600">0{index + 1}</span>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200">
                <area.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-7 font-display text-xl font-medium text-white">{area.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{area.description}</p>
              <span className="mt-auto flex items-center justify-between pt-7 text-xs font-medium text-cyan-200/80">
                {area.status}<ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-5 text-xs leading-5 text-slate-500">The platform is early-stage. Some research areas are exploratory and do not yet have complete tools or published analysis.</p>
      </section>

      <section className="border-y border-white/[0.07] bg-[#080f1b]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">From question to insight</p>
            <h2 className="mt-5 max-w-md font-display text-4xl font-light leading-tight text-white">A research process you can follow.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              A useful result is more than a chart. It needs a clear question, documented inputs,
              explainable choices, and enough context for someone else to challenge it.
            </p>
            <Link href="/methodology" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-cyan-200 hover:text-white">
              Explore the working standards <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { icon: Lightbulb, n: "01", title: "Frame the question", text: "Make the scope, timeframe, and decision context explicit." },
              { icon: Database, n: "02", title: "Trace the evidence", text: "Record source, coverage, definitions, and retrieval context." },
              { icon: BarChart3, n: "03", title: "Make the analysis inspectable", text: "Distinguish observations from assumptions and scenario outputs." },
              { icon: Users, n: "04", title: "Invite scrutiny", text: "Share limitations and make it possible for others to reproduce or disagree." },
            ].map((step) => (
              <article key={step.n} className="grid gap-4 rounded-xl border border-white/[0.08] bg-[#0c1726] p-5 sm:grid-cols-[3rem_1fr] sm:gap-5 sm:p-6">
                <div className="flex items-center gap-3 sm:block">
                  <span className="font-mono text-xs text-cyan-300">{step.n}</span>
                  <step.icon className="h-5 w-5 text-slate-500 sm:mt-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-medium text-white">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-cyan-200/15 bg-[linear-gradient(125deg,#0d2136_0%,#091522_55%,#111c2c_100%)]">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 sm:p-12 lg:p-14">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">Research in focus · Prototype</p>
              <h2 className="mt-5 max-w-xl font-display text-3xl font-light leading-tight text-white sm:text-4xl">Finland’s fiscal balance, made inspectable.</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
                A worked example connects a documented Eurostat snapshot to a deterministic calculation
                and bounded illustrative scenarios. It is a research prototype—not a forecast or policy recommendation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/dashboard/economy" className="inline-flex items-center gap-2 rounded-lg bg-cyan-200 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white">
                  Open the prototype <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/methodology" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/5">
                  See its assumptions
                </Link>
              </div>
            </div>
            <div className="relative min-h-64 border-t border-white/10 p-8 sm:p-12 lg:border-l lg:border-t-0 lg:p-14">
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_35%,rgba(65,203,253,0.15),transparent_55%)]" />
              <div className="relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-[#07111e]/70 p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Analysis notes</span>
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-2.5 py-1 text-[10px] font-medium text-amber-200">Illustrative</span>
                </div>
                <div className="my-8 space-y-3">
                  {["Sourced annual observations", "Transparent debt-ratio equation", "Baseline and stress scenarios"].map((item) => (
                    <div key={item} className="flex items-center gap-3 border-b border-white/[0.07] pb-3 text-sm text-slate-300">
                      <Check className="h-4 w-4 shrink-0 text-cyan-300" />{item}
                    </div>
                  ))}
                </div>
                <Link href="/research" className="inline-flex items-center gap-2 text-xs font-medium text-cyan-200 hover:text-white">
                  Browse research areas <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-[#080f1b]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">The principles</p>
            <h2 className="mt-5 font-display text-4xl font-light leading-tight text-white">Trust is built into the work.</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {principles.map((principle) => (
              <article key={principle.title} className="rounded-2xl border border-white/[0.08] bg-[#0b1523] p-7">
                <principle.icon className="h-5 w-5 text-cyan-200" />
                <h3 className="mt-6 font-display text-xl font-medium text-white">{principle.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{principle.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-10 rounded-3xl border border-amber-200/15 bg-amber-100/[0.035] p-8 sm:p-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200/15 bg-amber-200/[0.06] text-amber-200"><ShieldCheck className="h-5 w-5" /></span>
            <p className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-amber-200">Important context</p>
            <h2 className="mt-3 font-display text-3xl font-light text-white">A tool for inquiry, not authority.</h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-slate-300">
            <p>Open Polityra is an independent early-stage project—not an official government system, public authority, or intelligence agency. Research features and governance arrangements may be incomplete or experimental.</p>
            <p>Outputs can be incomplete, incorrect, or outdated. Verify sources independently and do not use prototypes as the sole basis for financial, policy, security, or operational decisions.</p>
            <Link href="/about" className="inline-flex items-center gap-2 font-medium text-cyan-200 hover:text-white">About the project <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(20,120,253,0.2),transparent_65%),#0a1422] px-6 py-16 text-center sm:px-12 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">Open research, together</p>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-light tracking-tight text-white sm:text-5xl">Help make complex questions easier to examine.</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400">Explore the working prototype, read the methods, or contribute to an open project still taking shape.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/research" className="inline-flex items-center gap-2 rounded-lg bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white">Explore research <ArrowRight className="h-4 w-4" /></Link>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/5"><Github className="h-4 w-4" />View the source</a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
