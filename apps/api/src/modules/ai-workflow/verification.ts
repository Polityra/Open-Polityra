import type { EvidencePack } from "./evidence";

export interface VerificationReport {
  status: "passed" | "flagged";
  failures: string[];
  warnings: string[];
  cited_ids: string[];
  invalid_citations: string[];
  unsupported_numbers: string[];
  uncited_numeric_statements: string[];
  advisory_phrases: string[];
  statements_total: number;
  statements_cited: number;
}

export interface EvidenceCoverage {
  ratio: number;
  level: "high" | "medium" | "low";
}

const CITATION = /\[((?:[EP]\d+)(?:\s*[,;]\s*[EP]\d+)*)\]/g;
const NUMBER = /\d+(?:[.,]\d+)?/g;
const ADVISORY =
  /\b(should|must|ought to|recommend(?:s|ed|ation|ations)?|advis(?:e|es|able)|need to)\b/gi;
const TOLERANCE = 0.051;

function numbersIn(text: string): number[] {
  return (text.match(NUMBER) ?? []).map((n) => Number.parseFloat(n.replace(",", ".")));
}

function stripCitations(text: string): string {
  return text.replace(CITATION, " ");
}

function splitStatements(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"“([])/))
    .map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}

/**
 * Checks an AI draft against the evidence it was given. This is a mechanical consistency
 * check; it cannot prove a claim is true, only that it points to evidence and uses its numbers.
 */
export function verifyExplanation(text: string, pack: EvidencePack): VerificationReport {
  const knownIds = new Set(pack.items.map((i) => i.id));
  const allowed = pack.items.flatMap((i) => numbersIn(i.text));

  const cited = new Set<string>();
  const invalid = new Set<string>();
  for (const match of text.matchAll(CITATION)) {
    for (const id of match[1].split(/\s*[,;]\s*/)) {
      cited.add(id);
      if (!knownIds.has(id)) invalid.add(id);
    }
  }

  const statements = splitStatements(text);
  const substantive = statements.filter((s) => stripCitations(s).split(/\s+/).length >= 5);
  const hasCitation = (s: string) => new RegExp(CITATION.source).test(s);
  const statementsCited = substantive.filter(hasCitation).length;

  const unsupported = new Set<string>();
  const uncitedNumeric: string[] = [];
  for (const statement of substantive) {
    const nums = numbersIn(stripCitations(statement));
    if (nums.length === 0) continue;
    if (!hasCitation(statement)) uncitedNumeric.push(statement.slice(0, 160));
    for (const n of nums) {
      if (!allowed.some((a) => Math.abs(a - n) <= TOLERANCE)) unsupported.add(String(n));
    }
  }

  const advisory = Array.from(
    new Set((stripCitations(text).match(ADVISORY) ?? []).map((p) => p.toLowerCase())),
  );

  const failures: string[] = [];
  const warnings: string[] = [];
  if (cited.size === 0) failures.push("The draft cites no evidence.");
  if (invalid.size > 0) {
    failures.push(`Cites evidence that does not exist: ${Array.from(invalid).join(", ")}.`);
  }
  if (unsupported.size > 0) {
    failures.push(
      `Uses numbers that are not in the evidence: ${Array.from(unsupported).join(", ")}.`,
    );
  }
  if (uncitedNumeric.length > 0) {
    failures.push(`${uncitedNumeric.length} statement(s) with numbers have no citation.`);
  }
  if (advisory.length > 0) {
    warnings.push(
      `Contains advisory wording (${advisory.join(", ")}); check it is not a recommendation.`,
    );
  }
  const uncited = substantive.length - statementsCited;
  if (uncited > 0) warnings.push(`${uncited} statement(s) carry no citation.`);

  return {
    status: failures.length === 0 ? "passed" : "flagged",
    failures,
    warnings,
    cited_ids: Array.from(cited).sort(),
    invalid_citations: Array.from(invalid),
    unsupported_numbers: Array.from(unsupported),
    uncited_numeric_statements: uncitedNumeric,
    advisory_phrases: advisory,
    statements_total: substantive.length,
    statements_cited: statementsCited,
  };
}

/** Share of substantive statements that carry a citation. This is coverage, not a probability of being right. */
export function evidenceCoverage(report: VerificationReport): EvidenceCoverage {
  const ratio =
    report.statements_total === 0 ? 0 : report.statements_cited / report.statements_total;
  const rounded = Number(ratio.toFixed(2));
  if (report.status === "flagged") return { ratio: rounded, level: "low" };
  return { ratio: rounded, level: ratio >= 0.8 ? "high" : ratio >= 0.5 ? "medium" : "low" };
}
