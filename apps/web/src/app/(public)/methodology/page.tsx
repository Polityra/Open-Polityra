import { FileText, Database, Eye, CheckSquare, Scale, GitMerge } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Navbar from "@/components/navigation/Navbar";
import { REPO_URL } from "@/lib/site";

const methodologySections = [
  {
    icon: FileText,
    title: "Research Methodology",
    content: [
      "All analysis follows a structured three-phase protocol: source identification and verification, indicator derivation through validated analytical methods, and peer review before publication.",
      "Analytical techniques include network analysis for alliance mapping, econometric modeling for economic indicators, scenario planning for strategic forecasting, and systemic risk propagation models for resilience assessment.",
    ],
  },
  {
    icon: Database,
    title: "Data Standards",
    content: [
      "Sources are classified into three tiers: primary (official statistics, treaties, military budgets), secondary (verified institutional reports, peer-reviewed academic work), and tertiary (documented media reporting). Each tier carries a distinct confidence weight.",
      "Every data point includes chain-of-custody metadata: original source URL, retrieval date, translator (if applicable), and the specific analytical step at which it enters the model.",
    ],
  },
  {
    icon: Eye,
    title: "Verification Protocols",
    content: [
      "Claims require corroboration from at least two independent sources before inclusion in published analysis. Where only a single source is available, the finding is clearly marked as single-source with reduced confidence weighting.",
      "Disputed findings are preserved in an appendix with both positions documented — no claim is suppressed because it conflicts with a preferred narrative.",
    ],
  },
  {
    icon: CheckSquare,
    title: "Quality Assurance",
    content: [
      "The Data Standards Board conducts quarterly methodological audits. All published reports include an appendix documenting deviation from standard protocol for any finding that required unusual analytical treatment.",
      "Reproducibility is a requirement: any qualified analyst should be able to reproduce published findings using the provided data, methodology, and source materials.",
    ],
  },
  {
    icon: Scale,
    title: "Bias Mitigation",
    content: [
      "Each research team includes members from at least three different institutional backgrounds. Analytical assumptions are explicitly stated in each report's methodology section.",
      "Devil's advocate review is mandatory for all strategic forecasts. Adversarial review panels challenge the primary analysis before publication.",
    ],
  },
  {
    icon: GitMerge,
    title: "Peer Review Process",
    content: [
      "All published analysis undergoes double-blind peer review by at least two independent analysts in the relevant domain. Reviewers must disclose conflicts of interest and sign an independence attestation.",
      "Review findings are appended to each publication with the authors' response. Disagreements on methodology or interpretation are preserved as part of the published record.",
    ],
  },
];

const confidenceLevels = [
  {
    label: "High Confidence",
    desc: "Multiple primary sources, peer-reviewed methods, corroborated across domains.",
    color: "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#86efac]",
  },
  {
    label: "Moderate Confidence",
    desc: "Two independent secondary sources or one primary plus verified tertiary source.",
    color: "border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fcd34d]",
  },
  {
    label: "Low Confidence",
    desc: "Single-source, conflicting reports, or preliminary data pending verification.",
    color: "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fca5a5]",
  },
];

export default function MethodologyPage() {
  return (
    <>
          <Navbar />

    <div className="min-h-screen bg-[#000610] text-[#eef2fc]">
      <section className="relative  isolate flex min-h-screen flex-col overflow-hidden">
        <PageHeader
          eyebrow="Methodology & Standards"
          title={
            <>
              How we produce <strong className="font-semibold">analysis</strong>
            </>
          }
          description="Every finding in Open Polityra follows a published, auditable process. This page documents the standards that govern how sources are evaluated, indicators derived, and analysis verified."
        />

        {/* Methodology Content */}
        <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8">
          <div className="space-y-12">
            {methodologySections.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center justify-center rounded-lg bg-[#1478fd]/15 p-2.5 text-[#41cbfd]">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-white">
                    {section.title}
                  </h2>
                </div>
                <div className="mt-4 space-y-4 border-l-2 border-[#1478fd]/50 pl-6">
                  {section.content.map((paragraph, i) => (
                    <p key={i} className="text-base leading-relaxed text-[#9aa8c7]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Confidence Framework */}
        <section className="border-t border-[#12306a]/70 bg-[#061230] py-16">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <h2 className="font-display text-2xl font-semibold text-white">
              Confidence Framework
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#9aa8c7]">
              All published analysis includes a confidence designation based on source quality and
              corroboration level.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {confidenceLevels.map((level) => (
                <div key={level.label} className={`rounded-lg border px-5 py-4 ${level.color}`}>
                  <span className="font-display font-semibold">{level.label}</span>
                  <p className="mt-1 text-sm opacity-80">{level.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-6 py-20 text-center lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-white">Review our standards</h2>
          <p className="mt-3 text-base text-[#9aa8c7]">
            Full methodological documentation is available in the repository for community review
            and contribution.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="/docs/methodology.pdf"
              className="rounded-lg bg-[#1478fd] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0b5fd9] hover:shadow-[0_0_24px_rgba(20,120,253,0.45)]"
            >
              Download Standards PDF
            </a>
            <a
              href={`${REPO_URL}/tree/main/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[#41cbfd]/30 px-5 py-2.5 text-sm font-semibold text-[#eef2fc] hover:bg-white/5"
            >
              View on GitHub
            </a>
          </div>
        </section>
      </section>

    </div>
    </>
  );
}
