import { Fragment, type ReactNode } from "react";

/**
 * Minimal, dependency-free renderer for the Markdown subset local models emit
 * (headings, **bold**, *italic*, `code`, bullet/numbered lists). It builds React elements only,
 * so model output is never injected as HTML.
 */

const INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\*[^*\s][^*\n]*\*|\[[EP]\d+\])/g;

function renderInline(text: string, citations: boolean, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (!part) return null;
    if (/^(\*\*|__).+(\*\*|__)$/.test(part)) {
      return (
        <strong key={key} className="font-semibold text-neutral-950">
          {renderInline(part.slice(2, -2), citations, key)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={key} className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return <em key={key}>{renderInline(part.slice(1, -1), citations, key)}</em>;
    }
    const cite = /^\[([EP]\d+)\]$/.exec(part);
    if (cite && citations) {
      return (
        <a
          key={key}
          href={`#evidence-${cite[1]}`}
          className="mx-0.5 rounded border border-black/10 bg-neutral-100 px-1 font-mono text-xs text-neutral-800 hover:bg-neutral-200"
        >
          {cite[1]}
        </a>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "p"; text: string };

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ type: "p", text: paragraph.join(" ") });
    paragraph = [];
  };

  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    const last = blocks[blocks.length - 1];

    if (!line) {
      flush();
    } else if (/^(-{3,}|\*{3,})$/.test(line)) {
      flush();
    } else if (heading) {
      flush();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
    } else if (bullet || numbered) {
      flush();
      const type = bullet ? "ul" : "ol";
      const text = (bullet ?? numbered)![1];
      if (last && last.type === type) last.items.push(text);
      else blocks.push({ type, items: [text] });
    } else if (
      last &&
      (last.type === "ul" || last.type === "ol") &&
      paragraph.length === 0 &&
      /^\s/.test(raw)
    ) {
      last.items[last.items.length - 1] += ` ${line}`;
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

const headingClass: Record<number, string> = {
  1: "text-lg font-semibold",
  2: "text-base font-semibold",
  3: "text-sm font-semibold",
};

export default function AiMarkdown({
  text,
  citations = false,
  className = "",
}: {
  text: string;
  /** Turn [E1]/[P2] markers into links to evidence items with matching ids. */
  citations?: boolean;
  className?: string;
}) {
  const blocks = parseBlocks(text);
  return (
    <div className={`space-y-3 text-sm leading-relaxed text-neutral-800 ${className}`}>
      {blocks.map((block, i) => {
        const key = `b${i}`;
        if (block.type === "heading") {
          return (
            <h4
              key={key}
              className={`mt-4 text-neutral-950 first:mt-0 ${headingClass[block.level] ?? "text-sm font-semibold"}`}
            >
              {renderInline(block.text, citations, key)}
            </h4>
          );
        }
        if (block.type !== "p") {
          const Tag = block.type;
          return (
            <Tag
              key={key}
              className={`space-y-1 pl-5 ${block.type === "ul" ? "list-disc" : "list-decimal"}`}
            >
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item, citations, `${key}-${j}`)}</li>
              ))}
            </Tag>
          );
        }
        return <p key={key}>{renderInline(block.text, citations, key)}</p>;
      })}
    </div>
  );
}
