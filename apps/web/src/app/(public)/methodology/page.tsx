import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  Database,
  FileCheck2,
  GitBranch,
  Scale,
  ShieldAlert,
} from "lucide-react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import HeroBackground from "@/components/landing/HeroBackground";
import { createPageMetadata, REPO_URL } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Research Methodology and Standards",
  description:
    "Explore Open Polityra's working principles for documenting public sources, explaining methods and assumptions, representing uncertainty, and communicating research limitations.",
  path: "/methodology",
});

const steps = [
  {
    icon: CircleHelp,
    number: "01",
    title: "Define the question",
    text: "State the subject, scope, timeframe, and intended use before choosing a method.",
  },
  {
    icon: Database,
    number: "02",
    title: "Document the evidence",
    text: "Record the source, coverage, definitions, retrieval date, and any known data gaps.",
  },
  {
    icon: GitBranch,
    number: "03",
    title: "Make the method reproducible",
    text: "Describe transformations, calculations, scenario assumptions, and relevant code or data.",
  },
  {
    icon: FileCheck2,
    number: "04",
    title: "Review and communicate limits",
    text: "Check outputs, preserve uncertainty, explain caveats, and invite independent scrutiny.",
  },
];

const standards = [
  {
    icon: BookOpen,
    title: "Source context",
    text: "Primary records, official statistics, research, and reporting have different strengths. Provenance and context matter more than a simple source count.",
  },
  {
    icon: Scale,
    title: "Fair interpretation",
    text: "Separate source claims from analysis. Represent meaningful disagreement and avoid presenting one interpretation as settled fact.",
  },
  {
    icon: ShieldAlert,
    title: "Responsible use",
    text: "Public information can still be sensitive or misused. Minimize unnecessary data and avoid publishing operationally harmful detail.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <Navbar />
      <main>
        <section className="relative isolate overflow-hidden border-b border-black/[0.08] px-6 pb-16 pt-36 sm:pb-20 sm:pt-40">
          <HeroBackground />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_0%,rgba(0,0,0,0.05),transparent_58%)]"
          />
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-500">
              Methods &amp; standards
            </p>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <h1 className="max-w-3xl font-display text-4xl font-light leading-[1.1] tracking-tight text-neutral-950 sm:text-6xl">
                Show the work.
                <br />
                <span className="text-neutral-500">Keep the uncertainty.</span>
              </h1>
              <p className="max-w-xl text-base leading-7 text-neutral-600 sm:text-lg">
                These are the principles and working practices Open Polityra aims to make visible.
                The project is early-stage; they are not a claim that every feature or review
                process is already implemented.
              </p>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={`${REPO_URL}/tree/main/research/methodology`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Browse research methods <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/research"
                className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-5 py-3 text-sm font-medium text-neutral-950 transition hover:bg-black/5"
              >
                Explore research areas
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
                A practical research loop
              </p>
              <h2 className="mt-5 max-w-sm font-display text-3xl font-light leading-tight text-neutral-950 sm:text-4xl">
                Make each step inspectable.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-600">
                A consistent record helps other people understand what happened between a question
                and a conclusion—and where they may reach a different one.
              </p>
            </div>
            <ol className="space-y-3">
              {steps.map(({ icon: Icon, number, title, text }) => (
                <li
                  key={number}
                  className="grid gap-4 rounded-2xl border border-black/[0.08] bg-white p-5 sm:grid-cols-[3.5rem_1fr] sm:gap-6 sm:p-7"
                >
                  <div className="flex items-center gap-3 sm:block">
                    <span className="font-mono text-xs text-neutral-500">{number}</span>
                    <Icon className="h-5 w-5 text-neutral-500 sm:mt-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-medium text-neutral-950">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-black/[0.07] bg-neutral-50">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
              Standards that shape the work
            </p>
            <h2 className="mt-5 max-w-2xl font-display text-3xl font-light text-neutral-950 sm:text-4xl">
              Good analysis is clear about what it knows.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {standards.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-black/[0.08] bg-white p-7"
                >
                  <Icon className="h-5 w-5 text-neutral-900" />
                  <h3 className="mt-6 font-display text-xl font-medium text-neutral-950">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-neutral-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-8 lg:py-24">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
              Prototype example
            </p>
            <h2 className="mt-5 font-display text-3xl font-light text-neutral-950">
              Not every output is a forecast.
            </h2>
          </div>
          <div className="rounded-2xl border border-black/10 bg-neutral-50 p-7 sm:p-9">
            <p className="text-sm leading-7 text-neutral-700">
              The Finland fiscal-balance work pairs a dated Eurostat data snapshot with a
              deterministic debt-ratio calculation and bounded scenarios. Scenario paths are
              illustrative, not predictions or policy recommendations. They omit real-world effects
              that would require additional data and expert review.
            </p>
            <Link
              href="/dashboard/economy"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-950 hover:text-neutral-500"
            >
              View the fiscal prototype <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-3xl border border-black/10 bg-white p-8 sm:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Limitations are part of the method
                </p>
                <h2 className="mt-4 max-w-2xl font-display text-3xl font-light text-neutral-950">
                  A transparent process does not guarantee a correct conclusion.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
                  Sources may be incomplete, methods may be unsuitable, and results may be wrong.
                  Independent domain review and human judgment remain essential; the platform cannot
                  substitute for either.
                </p>
              </div>
              <a
                href={`${REPO_URL}/tree/main/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/15 px-5 py-3 text-sm font-medium text-neutral-950 transition hover:bg-black/5"
              >
                Read project documentation <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
