import Link from "next/link";
import { Shield, BookOpen, Scale, Globe2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Navbar from "@/components/navigation/Navbar";
import { REPO_URL } from "@/lib/site";

const principles = [
  {
    icon: Scale,
    title: "Transparency",
    description:
      "All methodology, data sources, and analytical assumptions are published alongside findings. Research is reproducible by any qualified analyst.",
  },
  {
    icon: BookOpen,
    title: "Rigor",
    description:
      "Findings follow peer-reviewed standards. Indicators are validated against multiple independent sources before inclusion in analysis frameworks.",
  },
  {
    icon: Globe2,
    title: "Independence",
    description:
      "Open Polityra operates outside national governance structures. Funding and research priorities are determined by the community governance framework.",
  },
  {
    icon: Shield,
    title: "Integrity",
    description:
      "Source verification protocols ensure chain-of-custody for all intelligence data. Every claim in a report links to its original source material.",
  },
];

const governanceBodies = [
  {
    name: "Research Council",
    role: "Approves research priorities and methodology standards across all analysis domains.",
    composition: "Rotating membership of senior analysts from each research domain.",
  },
  {
    name: "Data Standards Board",
    role: "Maintains data quality specifications, source classification criteria, and verification protocols.",
    composition: "Technical leads and independent data science reviewers.",
  },
  {
    name: "Community Assembly",
    role: "Elected representatives who set the strategic direction and approve governance document amendments.",
    composition: "One delegate per contributing organization, with term limits.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#000610] text-[#eef2fc]">
      <Navbar />
      <PageHeader
        eyebrow="About Open Polityra"
        title={
          <>
            Independent strategic intelligence{" "}
            <strong className="font-semibold">for the public good</strong>
          </>
        }
        description="Open Polityra is an open-source platform producing independent strategic analysis across economics, geopolitics, security, and systemic resilience. We believe that transparent, peer-reviewed intelligence infrastructure strengthens collective decision-making."
      />

      {/* Mission */}
      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <h2 className="font-display text-2xl font-semibold text-white">Mission</h2>
        <div className="mt-6 space-y-6 text-base leading-relaxed text-[#9aa8c7]">
          <p>
            The platform addresses a gap in strategic analysis: the need for independently
            verified, open-source intelligence that is methodologically rigorous and accessible
            to any qualified analyst. National-centric frameworks cannot serve global systemic
            risk assessment; only a genuinely independent structure can.
          </p>
          <p>
            Our research produces cross-domain analysis that connects economic indicators,
            geopolitical shifts, security developments, and resilience metrics into coherent
            strategic assessments — not for any single government, but for the community of
            analysts, institutions, and citizens who depend on reliable information.
          </p>
        </div>

        <div className="mt-10 rounded-xl border border-[#41cbfd]/25 bg-gradient-to-br from-[#1478fd]/15 to-transparent p-8">
          <p className="font-mono text-sm font-semibold uppercase tracking-wider text-[#41cbfd]">
            Guiding Principle
          </p>
          <blockquote className="mt-3 font-display text-lg font-light leading-relaxed text-[#eef2fc]">
            &ldquo;Intelligence that cannot be audited is not intelligence — it is opinion. Open
            Polityra commits to publishable methodology as a condition of publication.&rdquo;
          </blockquote>
        </div>
      </section>

      {/* Principles */}
      <section className="border-t border-[#12306a]/70 bg-[#061230] py-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-white">Principles</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title} className="card border-[#12306a] bg-[#0a1a3d]">
                <div className="mb-3 inline-flex items-center justify-center rounded-lg bg-[#1478fd]/15 p-2.5 text-[#41cbfd]">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9aa8c7]">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance */}
      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <h2 className="font-display text-2xl font-semibold text-white">Governance Structure</h2>
        <p className="mt-4 text-base leading-relaxed text-[#9aa8c7]">
          Open Polityra operates under a tripartite governance framework designed to maintain
          independence from any single national or corporate influence.
        </p>
        <div className="mt-8 space-y-6">
          {governanceBodies.map((body) => (
            <div
              key={body.name}
              className="rounded-xl border border-[#12306a] bg-[#0a1a3d] p-6 transition-colors hover:border-[#1478fd]"
            >
              <h3 className="font-display text-lg font-semibold text-white">{body.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#c4cfe6]">{body.role}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-[#41cbfd]">
                Composition: {body.composition}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-lg border border-[#12306a] bg-[#061230] p-4 text-sm text-[#9aa8c7]">
          Full governance documents:{" "}
          <a
            href={`${REPO_URL}/blob/main/GOVERNANCE.md`}
            className="font-medium text-[#41cbfd] hover:underline"
          >
            GOVERNANCE.md
          </a>{" "}
          in the repository.
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#12306a]/70 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-white">
            Engage with the platform
          </h2>
          <p className="mt-3 text-base text-[#9aa8c7]">
            Explore our research areas, review methodology, or join as a contributor.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/research"
              className="rounded-lg bg-[#1478fd] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0b5fd9] hover:shadow-[0_0_24px_rgba(20,120,253,0.45)]"
            >
              Research Areas
            </Link>
            <Link
              href="/methodology"
              className="rounded-lg border border-[#41cbfd]/30 px-5 py-2.5 text-sm font-semibold text-[#eef2fc] hover:bg-white/5"
            >
              Methodology
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
