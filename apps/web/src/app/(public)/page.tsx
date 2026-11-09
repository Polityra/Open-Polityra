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
  GitBranch,
  Users,
} from "lucide-react";
import { createPageMetadata, REPO_URL } from "@/lib/site";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import HeroBackground from "@/components/landing/HeroBackground";
export const metadata = createPageMetadata({
  title: "Open-Source Research on Public Issues",
  description:
    "Explore transparent, public-source analysis of economics, geopolitics, security, and resilience. Open Polityra makes sources, assumptions, and uncertainty easier to inspect.",
  path: "/",
});
export const instant = false;

const researchAreas = [
  {
    icon: TrendingUp,
    title: "Economics",
    description:
      "Public finance, macroeconomic indicators, trade, and the assumptions behind each analysis.",
    href: "/dashboard/economy",
    status: "Prototype available",
  },
  {
    icon: Globe2,
    title: "Geopolitics",
    description:
      "A research scope for understanding international relationships, events, and competing perspectives.",
    href: "/dashboard/geopolitics",
    status: "Research area",
  },
  {
    icon: Shield,
    title: "Security",
    description:
      "Public-source context for security and cyber developments, with clear limits on what is verified.",
    href: "/dashboard/news",
    status: "Monitor available",
  },
  {
    icon: Activity,
    title: "Resilience",
    description:
      "Explore how interconnected systems respond to disruption and changing conditions.",
    href: "/dashboard/resilience",
    status: "Research area",
  },
];

const principles = [
  {
    icon: Database,
    title: "Trace every input",
    text: "Sources, retrieval dates, and data definitions belong beside the analysis—not hidden behind it.",
  },
  {
    icon: Lightbulb,
    title: "Show the assumptions",
    text: "Separate observed data from estimates, scenarios, and interpretations.",
  },
  {
    icon: HeartHandshake,
    title: "Keep people accountable",
    text: "Tools can inform decisions; responsibility remains with people and institutions.",
  },
];

export default async function HomePage() {
  await connection();

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <Navbar />
      {/* Hero — light, black and white */}
      <section className="relative isolate flex min-h-screen flex-col overflow-hidden">
        {/* Animated minimal background (replaces the static hero image) */}
        <HeroBackground />

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 pt-32 text-center">
          <div
            aria-hidden
            className="landing-hero-orbit absolute right-[-15rem] top-24 -z-10 h-[34rem] w-[34rem] rounded-full border border-black/[0.08] sm:right-[-10rem] lg:right-[-4rem]"
          />
          <div
            aria-hidden
            className="landing-hero-orbit landing-hero-orbit-delayed absolute right-[-11rem] top-40 -z-10 h-[26rem] w-[26rem] rounded-full border border-black/[0.06] sm:right-[-6rem] lg:right-0"
          />

          <h1 className="landing-hero-enter-2 max-w-4xl font-display text-5xl font-light leading-[1.05] tracking-tight text-neutral-950 sm:text-7xl lg:text-8xl">
            Complex questions.
            <br />
            <span className="bg-gradient-to-r from-neutral-950 via-neutral-600 to-neutral-400 bg-clip-text text-transparent">
              Clearer evidence.
            </span>
          </h1>
          <div className="landing-hero-rule mt-7 h-px w-full max-w-xl bg-gradient-to-r from-transparent via-black/40 to-transparent" />

          <p className="landing-hero-enter-3 mt-7 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Explore public issues with research that makes its sources, assumptions, and uncertainty
            visible. Open Polityra brings economics, geopolitics, security, and resilience into one
            open workspace.
          </p>

          <ul className="landing-hero-enter-3 mt-7 flex max-w-2xl flex-wrap justify-center gap-2 text-xs font-medium text-neutral-700 sm:text-sm">
            {[
              "Public sources",
              "Transparent methods",
              "Human-led decisions",
              "Early-stage project",
            ].map((t) => (
              <li
                key={t}
                className="rounded-full border border-black/15 bg-white/70 px-3 py-1.5 backdrop-blur"
              >
                {t}
              </li>
            ))}
          </ul>

          <div className="landing-hero-enter-3 mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              <GitBranch className="h-5 w-5" /> View the project
            </a>
            <Link
              href="/research"
              className="inline-flex items-center gap-2 rounded-lg border border-black/20 px-5 py-3 text-sm font-semibold text-neutral-950 backdrop-blur transition-colors hover:bg-black/5"
            >
              Explore the research <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <a
            href="#start-here"
            className="landing-hero-enter-3 mt-12 inline-flex items-center gap-2 text-xs text-slate-400 transition-colors hover:text-cyan-100"
          >
            Discover the project{" "}
            <span aria-hidden className="landing-scroll-cue">
              ↓
            </span>
          </a>
        </div>

        {/* Logo, bottom-left. Black-text version: save as /public/images/logo-black.png */}
        <div className="px-6 pb-8 p-24 lg:px-8">
          <Image
            src="/images/logo-dark.png"
            alt="Open Polityra"
            width={1040}
            height={312}
            className="h-auto w-48 sm:w-64"
          />
        </div>
      </section>

      <section className="relative border-y border-black/[0.08] bg-neutral-50">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,0,0,0.04),transparent_65%)]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-3 sm:gap-0 lg:px-8">
          {[
            ["Open by design", "Code, methods, and assumptions are inspectable."],
            ["Evidence-led", "Public sources and traceable data ground the work."],
            ["Human accountable", "Analysis supports decisions; it never makes them."],
          ].map(([title, text], index) => (
            <div
              key={title}
              className={`px-0 sm:px-8 ${index > 0 ? "sm:border-l sm:border-black/10" : ""}`}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                0{index + 1} / Principle
              </p>
              <h2 className="mt-3 font-display text-xl font-medium text-neutral-950">{title}</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="start-here"
        className="scroll-mt-20 mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-8"
      >
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-500">
              A place to begin
            </p>
            <h2 className="mt-5 max-w-md font-display text-3xl font-light leading-tight text-neutral-950 sm:text-4xl">
              Follow a question from source to scenario.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            Whether you are exploring a research topic, reviewing a worked example, or checking how
            an analysis is framed, start with the evidence and keep the limitations in view.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              number: "01",
              title: "Explore a research area",
              text: "See the questions the project is investigating and what is currently available.",
              href: "/research",
              action: "Browse research",
            },
            {
              number: "02",
              title: "Inspect a worked example",
              text: "Follow a public-data fiscal prototype with explicit calculations and scenarios.",
              href: "/dashboard/economy",
              action: "Open the prototype",
            },
            {
              number: "03",
              title: "Review the methods",
              text: "Understand how sources, assumptions, and uncertainty should be documented.",
              href: "/methodology",
              action: "Read the standards",
            },
          ].map((item) => (
            <Link
              key={item.number}
              href={item.href}
              className="group rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-black/30 hover:bg-neutral-50 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              <span className="font-mono text-xs text-neutral-500">{item.number} / Start here</span>
              <h3 className="mt-5 font-display text-xl font-medium text-neutral-950">
                {item.title}
              </h3>
              <p className="mt-3 min-h-12 text-sm leading-6 text-neutral-600">{item.text}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-950">
                {item.action}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-500">
              A connected view
            </p>
            <h2 className="mt-5 max-w-lg font-display text-4xl font-light leading-tight tracking-tight text-neutral-950 sm:text-5xl">
              See the systems behind the headlines.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
            Open Polityra brings public information and transparent methods into one research
            workspace. Explore connected questions across economies, geopolitics, security, and
            resilience without confusing a model with the real world.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {researchAreas.map((area, index) => (
            <Link
              key={area.title}
              href={area.href}
              className="group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-black/30 hover:bg-neutral-50 hover:shadow-md"
            >
              <span className="absolute right-5 top-5 font-mono text-xs text-neutral-400">
                0{index + 1}
              </span>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-neutral-100 text-neutral-900">
                <area.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-7 font-display text-xl font-medium text-neutral-950">
                {area.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{area.description}</p>
              <span className="mt-auto flex items-center justify-between pt-7 text-xs font-medium text-neutral-600">
                {area.status}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-5 text-xs leading-5 text-neutral-500">
          The platform is early-stage. Some research areas are exploratory and do not yet have
          complete tools or published analysis.
        </p>
      </section>

      <section className="border-y border-black/[0.08] bg-neutral-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-500">
              From question to insight
            </p>
            <h2 className="mt-5 max-w-md font-display text-4xl font-light leading-tight text-neutral-950">
              A research process you can follow.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-neutral-600">
              A useful result is more than a chart. It needs a clear question, documented inputs,
              explainable choices, and enough context for someone else to challenge it.
            </p>
            <Link
              href="/methodology"
              className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-neutral-950 hover:text-neutral-500"
            >
              Explore the working standards <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              {
                icon: Lightbulb,
                n: "01",
                title: "Frame the question",
                text: "Make the scope, timeframe, and decision context explicit.",
              },
              {
                icon: Database,
                n: "02",
                title: "Trace the evidence",
                text: "Record source, coverage, definitions, and retrieval context.",
              },
              {
                icon: BarChart3,
                n: "03",
                title: "Make the analysis inspectable",
                text: "Distinguish observations from assumptions and scenario outputs.",
              },
              {
                icon: Users,
                n: "04",
                title: "Invite scrutiny",
                text: "Share limitations and make it possible for others to reproduce or disagree.",
              },
            ].map((step) => (
              <article
                key={step.n}
                className="grid gap-4 rounded-xl border border-black/[0.08] bg-white p-5 shadow-sm sm:grid-cols-[3rem_1fr] sm:gap-5 sm:p-6"
              >
                <div className="flex items-center gap-3 sm:block">
                  <span className="font-mono text-xs text-neutral-500">{step.n}</span>
                  <step.icon className="h-5 w-5 text-neutral-500 sm:mt-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-medium text-neutral-950">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-[linear-gradient(125deg,#fafafa_0%,#ffffff_55%,#f4f4f5_100%)] shadow-sm">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 sm:p-12 lg:p-14">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-500">
                Research in focus · Prototype
              </p>
              <h2 className="mt-5 max-w-xl font-display text-3xl font-light leading-tight text-neutral-950 sm:text-4xl">
                Finland’s fiscal balance, made inspectable.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-700">
                A worked example connects a documented Eurostat snapshot to a deterministic
                calculation and bounded illustrative scenarios. It is a research prototype—not a
                forecast or policy recommendation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/economy"
                  className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Open the prototype <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/methodology"
                  className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-black/5"
                >
                  See its assumptions
                </Link>
              </div>
            </div>
            <div className="relative min-h-64 border-t border-black/10 p-8 sm:p-12 lg:border-l lg:border-t-0 lg:p-14">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_35%,rgba(0,0,0,0.05),transparent_55%)]"
              />
              <div className="relative flex h-full flex-col justify-between rounded-2xl border border-black/10 bg-white/80 p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                    Analysis notes
                  </span>
                  <span className="rounded-full border border-black/15 bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-700">
                    Illustrative
                  </span>
                </div>
                <div className="my-8 space-y-3">
                  {[
                    "Sourced annual observations",
                    "Transparent debt-ratio equation",
                    "Baseline and stress scenarios",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 border-b border-black/[0.08] pb-3 text-sm text-neutral-700"
                    >
                      <Check className="h-4 w-4 shrink-0 text-neutral-950" />
                      {item}
                    </div>
                  ))}
                </div>
                <Link
                  href="/research"
                  className="inline-flex items-center gap-2 text-xs font-medium text-neutral-950 hover:text-neutral-500"
                >
                  Browse research areas <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/[0.08] bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-500">
              The principles
            </p>
            <h2 className="mt-5 font-display text-4xl font-light leading-tight text-neutral-950">
              Trust is built into the work.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {principles.map((principle) => (
              <article
                key={principle.title}
                className="rounded-2xl border border-black/[0.08] bg-white p-7 shadow-sm"
              >
                <principle.icon className="h-5 w-5 text-neutral-900" />
                <h3 className="mt-6 font-display text-xl font-medium text-neutral-950">
                  {principle.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{principle.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-10 rounded-3xl border border-black/10 bg-neutral-50 p-8 sm:p-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div className="lg:sticky items-start lg:top-28 lg:self-start">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-neutral-900">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <p className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
              Important context
            </p>
            <h2 className="mt-3 font-display text-3xl font-light text-neutral-950">
              A tool for inquiry, not authority.
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-neutral-700">
            <p>
              Open Polityra is an independent early-stage project—not an official government system,
              public authority, or intelligence agency. Research features and governance
              arrangements may be incomplete or experimental.
            </p>
            <p>
              Outputs can be incomplete, incorrect, or outdated. Verify sources independently and do
              not use prototypes as the sole basis for financial, policy, security, or operational
              decisions.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 font-medium text-neutral-950 hover:text-neutral-500"
            >
              About the project <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Closing call to action — the one inverted black block */}
      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-black bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.14),transparent_65%),#0a0a0a] px-6 py-16 text-center sm:px-12 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-400">
            Open research, together
          </p>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-light tracking-tight text-black sm:text-5xl">
            Help make complex questions easier to examine.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-neutral-400">
            Explore the working prototype, read the methods, or contribute to an open project still
            taking shape.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/research"
              className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-200"
            >
              Explore research <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-black/25 px-5 py-3 text-sm font-medium text-black transition hover:bg-black/10"
            >
              <GitBranch className="h-4 w-4" />
              View the source
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
