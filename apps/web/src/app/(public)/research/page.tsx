import Link from "next/link";
import {
  BarChart3,
  Globe2,
  ShieldAlert,
  Activity,
  Building2,
  Ship,
  ChevronRight,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Navbar from "@/components/navigation/Navbar";

const researchAreas = [
  {
    icon: BarChart3,
    title: "Economics",
    domain: "economic-analysis",
    description:
      "Macroeconomic indicators, trade flow analysis, monetary policy impact assessment, and supply chain vulnerability mapping. Cross-references fiscal data across sovereign and supranational entities.",
    tags: ["Monetary Policy", "Trade Flows", "Fiscal Analysis"],
  },
  {
    icon: Globe2,
    title: "Geopolitics",
    domain: "geopolitical-analysis",
    description:
      "Diplomatic relationship mapping, alliance network analysis, territorial dispute tracking, and strategic resource distribution. Monitors institutional shifts in multilateral organizations.",
    tags: ["Alliance Networks", "Territorial Analysis", "Institutional Shifts"],
  },
  {
    icon: ShieldAlert,
    title: "Security",
    domain: "security-assessment",
    description:
      "Conventional and asymmetric threat assessment, military capability tracking, cyber vulnerability analysis, and arms proliferation monitoring. Integrates open-source intelligence with verified classified reporting.",
    tags: ["Threat Assessment", "Capability Tracking", "Cyber Analysis"],
  },
  {
    icon: Activity,
    title: "Resilience",
    domain: "resilience-monitoring",
    description:
      "Critical infrastructure vulnerability mapping, systemic risk propagation modeling, emergency response capacity assessment, and continuity planning. Focuses on cascading failure scenarios across interconnected systems.",
    tags: ["Infrastructure Risk", "Cascading Failure", "Response Capacity"],
  },
  {
    icon: Building2,
    title: "Public Services",
    domain: "public-services-analysis",
    description:
      "Healthcare system capacity, education infrastructure assessment, social safety net analysis, and institutional effectiveness measurement. Benchmarks performance against international standards.",
    tags: ["Healthcare Systems", "Education Metrics", "Institutional Quality"],
  },
  {
    icon: Ship,
    title: "International Trade",
    domain: "trade-analysis",
    description:
      "Supply chain disruption analysis, tariff impact modeling, shipping route vulnerability assessment, and commodity flow monitoring. Tracks bilateral and multilateral trade agreements and their strategic implications.",
    tags: ["Trade Agreements", "Commodity Flows", "Route Analysis"],
  },
];

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-[#000610] text-[#eef2fc]">
      <Navbar />
      <PageHeader
        eyebrow="Research Domains"
        title={
          <>
            Six analysis <strong className="font-semibold">pillars</strong>
          </>
        }
        description="Open Polityra structures its research across six interdependent domains. Each pillar produces independently verifiable analysis that feeds into cross-domain strategic assessments."
      />

      {/* Research Area Cards */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8">
        <div className="space-y-6">
          {researchAreas.map((area, index) => (
            <Link
              key={area.title}
              href={`/dashboard/${area.domain.replace("-", "")}`}
              className="group flex gap-6 rounded-xl border border-[#12306a] bg-[#0a1a3d] p-6 "
            >
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center rounded-lg bg-[#1478fd]/15 p-3 text-[#41cbfd] transition-colors group-hover:bg-[#1478fd]/25">
                  <area.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-medium text-[#74829f]">
                    0{index + 1}
                  </span>
                  <h2 className="font-display text-xl font-semibold text-white transition-colors group-hover:text-[#41cbfd]">
                    {area.title}
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#9aa8c7]">{area.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {area.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#41cbfd]/20 bg-[#1478fd]/10 px-2.5 py-0.5 text-xs font-medium text-[#a3ecff]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 self-center text-[#324c80] transition-transform group-hover:translate-x-1 group-hover:text-[#41cbfd]" />
            </Link>
          ))}
        </div>
      </section>

      {/* Cross-Domain Note */}
      <section className="border-t border-[#12306a]/70 bg-[#061230] py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="rounded-xl border border-[#41cbfd]/25 bg-gradient-to-br from-[#1478fd]/15 to-transparent p-8">
            <h2 className="font-display text-lg font-semibold text-white">
              Cross-Domain Analysis
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#9aa8c7]">
              The six pillars feed into quarterly cross-domain strategic assessments. Each
              assessment identifies priority scenarios where developments across multiple domains
              create compound risk profiles that cannot be understood through single-domain
              analysis alone.
            </p>
            <Link
              href="/dashboard/scenarios"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#41cbfd] hover:text-[#a3ecff]"
            >
              Explore Cross-Domain Scenarios &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
