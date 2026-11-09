import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  description: string;
};

/** Shared header for inner pages. Sits below the fixed Navbar. */
export default function PageHeader({ eyebrow, title, description }: Props) {
  return (
    <section className="relative isolate mt-16 overflow-hidden border-b border-[#12306a]/70 bg-[#000610] pb-20 pt-20">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_0%,rgba(20,120,253,0.28),transparent_60%)]"
      />

      <div className="mx-auto mt-16 max-w-4xl px-6 lg:px-8">
        <p className="font-mono text-sm font-medium uppercase tracking-wider text-[#41cbfd]">
          {eyebrow}
        </p>

        <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-white sm:text-5xl">
          {title}
        </h1>

        <div className="mt-6 h-0.5 w-24 bg-gradient-to-r from-[#32b2f7] to-[#3468f5]" />

        <p className="mt-6 text-lg leading-relaxed text-[#c4cfe6]">{description}</p>
      </div>
    </section>
  );
}
