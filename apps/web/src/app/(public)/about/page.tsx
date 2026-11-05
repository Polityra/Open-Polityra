import Link from "next/link";
import { ArrowRight, BookOpen, Eye, GitBranch, Scale, Users } from "lucide-react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import { REPO_URL } from "@/lib/site";

const principles = [
  {
    icon: Eye,
    number: "01",
    title: "Make the evidence visible",
    text: "Sources, methods, assumptions, and limitations should be easy to inspect.",
  },
  {
    icon: Scale,
    number: "02",
    title: "Treat uncertainty honestly",
    text: "Separate facts, estimates, interpretations, and scenarios instead of flattening them into certainty.",
  },
  {
    icon: Users,
    number: "03",
    title: "Keep decisions human",
    text: "The platform is intended to support people—not replace democratic institutions or professional judgment.",
  },
  {
    icon: GitBranch,
    number: "04",
    title: "Build in the open",
    text: "Open-source development makes it possible to review the code, question design choices, and contribute.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050a12] text-[#eef2fc]">
      <Navbar />
      <main>
        <section className="relative isolate overflow-hidden border-b border-white/[0.08] px-6 pb-16 pt-36 sm:pb-20 sm:pt-40">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_18%_0%,rgba(20,120,253,0.2),transparent_60%)]"
          />
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">
              About the project
            </p>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <h1 className="max-w-3xl font-display text-4xl font-light leading-[1.1] tracking-tight text-white sm:text-6xl">
                Open knowledge for <span className="text-cyan-200">complex questions.</span>
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                Open Polityra is an independent, open-source research project exploring how public
                information can support clearer analysis across economics, geopolitics, security,
                resilience, and governance.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/research"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white"
              >
                Explore research <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Browse the source <GitBranch className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-28">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
              Why this exists
            </p>
            <h2 className="mt-5 max-w-md font-display text-3xl font-light leading-tight text-white sm:text-4xl">
              Better analysis starts with better questions.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-7 text-slate-400">
            <p>
              Public decisions often depend on information scattered across datasets, research, and
              reporting. This project is an attempt to bring evidence and analytical context
              together in ways that can be examined and challenged.
            </p>
            <p>
              The aim is not to produce a single authoritative answer. It is to make the reasoning
              behind an answer more visible: where information came from, what assumptions were
              made, where uncertainty remains, and what the tools can—and cannot—say.
            </p>
            <p>
              Open Polityra is early-stage. The current repository includes working software and a
              narrow fiscal-balance prototype; many broader ambitions remain research directions
              rather than finished capabilities.
            </p>
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-[#080f1b]">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                Project principles
              </p>
              <h2 className="mt-5 font-display text-3xl font-light text-white sm:text-4xl">
                The standards we are working toward.
              </h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {principles.map(({ icon: Icon, number, title, text }) => (
                <article
                  key={number}
                  className="rounded-2xl border border-white/[0.08] bg-[#0b1523] p-7 sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-cyan-200" />
                    <span className="font-mono text-xs text-slate-600">{number}</span>
                  </div>
                  <h3 className="mt-7 font-display text-xl font-medium text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <article className="rounded-2xl border border-white/[0.08] bg-[#0a1422] p-8 sm:p-10">
            <BookOpen className="h-5 w-5 text-cyan-200" />
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
              Current status
            </p>
            <h2 className="mt-3 font-display text-2xl font-light text-white">
              A project in progress.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Some application features are prototypes; not all research areas have complete data or
              analysis. Independent research review, governance capacity, and organizational
              arrangements should not be assumed unless explicitly documented.
            </p>
            <Link
              href="/methodology"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-200 hover:text-white"
            >
              Read the methodology notes <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
          <article className="rounded-2xl border border-amber-200/15 bg-amber-100/[0.035] p-8 sm:p-10">
            <Scale className="h-5 w-5 text-amber-200" />
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-amber-200">
              Independence and accountability
            </p>
            <h2 className="mt-3 font-display text-2xl font-light text-white">
              Not an official authority.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Open Polityra is not a government system, public authority, political party, or
              government commission. It does not make or automate public decisions. Outputs may be
              incomplete, incorrect, or outdated and should be independently checked.
            </p>
            <a
              href={`${REPO_URL}/blob/main/GOVERNANCE.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-200 hover:text-white"
            >
              Read the governance proposal <ArrowRight className="h-4 w-4" />
            </a>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
