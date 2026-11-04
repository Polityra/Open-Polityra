"use client";

// Replaces the root layout when it crashes, so it must render <html>/<body>
// and import its own CSS. Fonts fall back to system fonts here.
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#000610] text-[#eef2fc]">
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="bg-gradient-to-br from-[#1478fd] via-[#41cbfd] to-[#eef2fc] bg-clip-text text-8xl font-semibold leading-none text-transparent sm:text-9xl">
            500
          </p>
          <p className="mt-6 font-mono text-sm uppercase tracking-wider text-[#41cbfd]">
            Critical error
          </p>
          <h1 className="mt-3 text-3xl font-light text-white sm:text-4xl">
            Open Polityra ran into a problem
          </h1>
          <div className="mt-5 h-0.5 w-16 bg-gradient-to-r from-[#32b2f7] to-[#3468f5]" />
          <p className="mt-5 max-w-lg text-[#9aa8c7]">
            The application failed to load. Please try again. If this keeps happening, contact the
            maintainers.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-8 rounded-lg bg-[#1478fd] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0b5fd9]"
          >
            Reload
          </button>
          {error.digest && (
            <p className="mt-8 font-mono text-xs text-[#74829f]">Reference: {error.digest}</p>
          )}
        </main>
      </body>
    </html>
  );
}
