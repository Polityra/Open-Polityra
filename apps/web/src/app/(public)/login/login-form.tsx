"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";

import HeroBackground from "@/components/landing/HeroBackground";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);

      try {
        await login(email, password);

        const redirect = searchParams.get("redirect") ?? "/dashboard";
        let safeRedirect = "/dashboard";
        try {
          const target = new URL(redirect, window.location.origin);
          if (target.origin === window.location.origin) {
            safeRedirect = `${target.pathname}${target.search}${target.hash}`;
          }
        } catch {
          // Keep the default route when the supplied redirect is not a valid URL.
        }

        router.push(safeRedirect);
        router.refresh();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Login failed. Check your credentials.");
        } else {
          setError("Login failed. Please try again.");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, login, router, searchParams],
  );

  return (
    <main className="relative grid min-h-screen overflow-hidden text-neutral-950 lg:grid-cols-[1fr_0.85fr]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_20%,rgba(0,0,0,0.05),transparent_42%)]"
      />
      <section className="relative hidden flex-col justify-between px-12 py-10 lg:flex xl:px-20">
        <HeroBackground />

        <Link href="/" aria-label="Open Polityra home" className="inline-flex w-fit">
          <Image
            src="/images/logo-dark.png"
            alt="Open Polityra"
            width={1040}
            height={312}
            className="h-auto w-48"
          />
        </Link>
        <div className="max-w-xl pb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-neutral-100 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            <ShieldCheck className="h-3.5 w-3.5" /> Research workspace
          </span>
          <h1 className="mt-7 font-display text-5xl font-light leading-[1.08] tracking-tight text-neutral-950 xl:text-6xl">
            Bring evidence
            <br />
            into <span className="text-neutral-500">focus.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-neutral-600">
            An open-source project for examining public questions with transparent data, methods,
            and assumptions.
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
          Open source · Human accountable · Early-stage
        </p>
      </section>

      <section className="relative flex items-center justify-center border-t border-black/[0.08] px-5 py-12 sm:px-8 lg:border-l lg:border-t-0 lg:px-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-600 transition hover:text-neutral-950"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <div className="rounded-2xl border border-black/10 bg-white/90 p-6 shadow-xl shadow-black/5 backdrop-blur sm:p-9">
            <div className="mb-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                Your workspace
              </p>
              <h2 className="mt-3 font-display text-3xl font-light text-neutral-950">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Sign in to continue to Open Polityra.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-neutral-800">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.org"
                  className="h-12 w-full rounded-lg border border-black/10 bg-white px-3.5 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-black/50 focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-lg border border-black/10 bg-white px-3.5 pr-11 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-black/50 focus:ring-2 focus:ring-black/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-neutral-900"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || isLoading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
            <p className="mt-7 border-t border-black/[0.08] pt-6 text-center text-sm text-neutral-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-neutral-950 hover:text-neutral-500"
              >
                Create one
              </Link>
            </p>
          </div>
          <p className="mt-5 text-center text-xs leading-5 text-neutral-400">
            Early-stage research software. Verify outputs independently.
          </p>
        </div>
      </section>
    </main>
  );
}
