/* eslint-disable @typescript-eslint/no-unused-vars */
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import {
  BarChart3,
  GitBranch,
  Users,
  ArrowRight,
  BookOpen,
  Globe2,
  Shield,
  TrendingUp,
  Github,
} from "lucide-react";
import { REPO_URL } from "@/lib/site";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
export const instant = false;

const features = [
  {
    icon: BookOpen,
    title: "Research Platform",
    description:
      "Structured knowledge base spanning economics, geopolitics, security analysis, and international trade with transparent methodology.",
  },
  {
    icon: BarChart3,
    title: "Data Analysis",
    description:
      "Multi-source data aggregation and analysis pipeline. Cross-reference indicators across national and systemic dimensions.",
  },
  {
    icon: GitBranch,
    title: "Scenario Modeling",
    description:
      "Construct, compare, and track scenario pathways. Stress-test policy assumptions against multiple futures simultaneously.",
  },
  {
    icon: Users,
    title: "Open Community",
    description:
      "Transparent governance framework with peer review workflows, public data standards, and collaborative research protocols.",
  },
];

const architectureSteps = [
  { step: 1, label: "User Interface", icon: Globe2, desc: "Dashboard, reports, scenario tools" },
  { step: 2, label: "API Gateway", icon: TrendingUp, desc: "Routing, auth, rate limiting" },
  { step: 3, label: "Analysis Engine", icon: BarChart3, desc: "Python processing, ML models" },
  { step: 4, label: "Data Layer", icon: Shield, desc: "PostgreSQL, source store, cache" },
];

const footerLink = "text-[#74829f] transition-colors hover:text-[#41cbfd]";

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

      {/* Feature Cards */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group card relative overflow-hidden border-[#12306a] bg-[#0a1a3d] p-8 hover:border-[#1478fd]"
            >
              <div className="mb-5 inline-flex items-center justify-center rounded-lg bg-[#1478fd]/15 p-3 text-[#41cbfd] group-hover:bg-[#1478fd]/25">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9aa8c7]">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="border-t border-[#12306a]/70 bg-[#061230] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="font-mono text-sm font-medium uppercase tracking-wider text-[#41cbfd]">
              System Architecture
            </p>
            <h2 className="mt-2 font-display text-3xl font-light tracking-tight text-white sm:text-4xl">
              Data Flow <strong className="font-semibold">Pipeline</strong>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#9aa8c7]">
              Multi-layered architecture designed for transparency and auditability. Every data
              point traces to its original source.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {architectureSteps.map((step, i) => (
              <div key={step.step} className="relative">
                <div className="card flex flex-col items-center border-[#12306a] bg-[#0a1a3d] text-center">
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1478fd]/20 text-[#41cbfd]">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-medium text-[#74829f]">
                    STEP {String(step.step).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1 font-display text-base font-semibold text-white">
                    {step.label}
                  </h3>
                  <p className="mt-1 text-xs text-[#9aa8c7]">{step.desc}</p>
                </div>
                {i < architectureSteps.length - 1 && (
                  <div className="hidden lg:absolute lg:-right-6 lg:top-1/2 lg:block lg:-translate-y-1/2 lg:text-[#41cbfd]">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="rounded-2xl border border-[#41cbfd]/25 bg-gradient-to-br from-[#1478fd] via-[#0b5fd9] to-[#0f2147] px-8 py-16 text-center shadow-[0_0_60px_rgba(20,120,253,0.25)] sm:px-16">
          <h2 className="font-display text-3xl font-light tracking-tight text-white sm:text-4xl">
            Begin <strong className="font-semibold">Strategic Analysis</strong>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#d3e6ff]">
            Explore the platform&apos;s research modules, data sources, and scenario modeling
            tools. All methodology is open for review.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0a4bb0] shadow-sm hover:bg-[#eef2fc]"
            >
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Review Methodology
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
