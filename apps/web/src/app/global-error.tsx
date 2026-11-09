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
      <body className="bg-white text-neutral-950">
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="bg-gradient-to-br from-neutral-950 via-neutral-600 to-neutral-300 bg-clip-text text-8xl font-semibold leading-none text-transparent sm:text-9xl">
            500
          </p>
          <p className="mt-6 font-mono text-sm uppercase tracking-wider text-neutral-500">
            Critical error
          </p>
          <h1 className="mt-3 text-3xl font-light text-neutral-950 sm:text-4xl">
            Open Polityra ran into a problem
          </h1>
          <div className="mt-5 h-0.5 w-16 bg-gradient-to-r from-neutral-400 to-neutral-950" />
          <p className="mt-5 max-w-lg text-neutral-600">
            The application failed to load. Please try again. If this keeps happening, contact the
            maintainers.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-8 rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Reload
          </button>
          {error.digest && (
            <p className="mt-8 font-mono text-xs text-neutral-400">Reference: {error.digest}</p>
          )}
        </main>
      </body>
    </html>
  );
}
