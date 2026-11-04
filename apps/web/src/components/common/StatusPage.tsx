import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  code?: string;
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode; // action buttons
  detail?: string; // e.g. error digest
  /** Fill the viewport (site) or sit inside an existing layout (dashboard) */
  fullScreen?: boolean;
};

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#1478fd] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0b5fd9] hover:shadow-[0_0_24px_rgba(20,120,253,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#41cbfd]";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#41cbfd]/30 px-5 py-2.5 text-sm font-semibold text-[#eef2fc] transition-colors hover:bg-white/5";

export default function StatusPage({
  code,
  eyebrow,
  title,
  description,
  children,
  detail,
  fullScreen = true,
}: Props) {
  return (
    <main
      className={`relative isolate flex flex-col items-center justify-center overflow-hidden bg-[#000610] px-6 text-center text-[#eef2fc] ${
        fullScreen ? "min-h-screen py-16" : "min-h-[60vh] rounded-xl border border-[#12306a] py-16"
      }`}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(20,120,253,0.28),transparent_60%)]"
      />
      {fullScreen && (
        <Link href="/" aria-label="Open Polityra home" className="mb-12">
          <Image
            src="/images/logo-transparent.png"
            alt="Open Polityra"
            width={1040}
            height={312}
            priority
            className="h-10 w-auto"
          />
        </Link>
      )}

      {code && (
        <p
          aria-hidden
          className="bg-gradient-to-br from-[#1478fd] via-[#41cbfd] to-[#eef2fc] bg-clip-text font-display text-8xl font-semibold leading-none tracking-tight text-transparent sm:text-9xl"
        >
          {code}
        </p>
      )}
      <p className="mt-6 font-mono text-sm font-medium uppercase tracking-wider text-[#41cbfd]">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-3xl font-light tracking-tight text-white sm:text-4xl">
        {title}
      </h1>
      <div className="mt-5 h-0.5 w-16 bg-gradient-to-r from-[#32b2f7] to-[#3468f5]" />
      <p className="mt-5 max-w-lg text-base leading-relaxed text-[#9aa8c7]">{description}</p>

      {children && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>}

      {detail && (
        <p className="mt-8 font-mono text-xs text-[#74829f]">Reference: {detail}</p>
      )}
    </main>
  );
}
