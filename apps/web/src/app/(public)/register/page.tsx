"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }

      setSubmitting(true);
      try {
        await register(email, password, name || undefined, "analyst");
        router.push("/dashboard");
        router.refresh();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Registration failed. Please try again.");
        } else {
          setError("Registration failed. Please try again.");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, name, confirmPassword, register, router],
  );

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#050a12] text-[#eef2fc] lg:grid-cols-[1fr_0.85fr]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_20%,rgba(20,120,253,0.18),transparent_42%)]"
      />
      <section className="relative hidden flex-col justify-between px-12 py-10 lg:flex xl:px-20">
        <Link href="/" aria-label="Open Polityra home" className="inline-flex w-fit">
          <Image
            src="/images/logo-transparent.png"
            alt="Open Polityra"
            width={1040}
            height={312}
            className="h-auto w-48"
          />
        </Link>
        <div className="max-w-xl pb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/[0.05] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Open research project
          </span>
          <h1 className="mt-7 font-display text-5xl font-light leading-[1.08] tracking-tight text-white xl:text-6xl">
            Join a more
            <br />
            transparent way
            <br />
            to <span className="text-cyan-200">explore.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
            Open Polityra is an early-stage project. Explore the software, inspect the methods, and
            help improve the work.
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">
          Open source · Human accountable · Early-stage
        </p>
      </section>

      <section className="relative flex items-center justify-center border-t border-white/[0.08] px-5 py-10 sm:px-8 lg:border-l lg:border-t-0 lg:px-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="rounded-2xl border border-white/10 bg-[#0a1422]/90 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-9">
            <div className="mb-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">
                Create your account
              </p>
              <h2 className="mt-3 font-display text-3xl font-light text-white">Get started</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Join the Open Polityra research workspace.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/[0.07] p-3 text-sm text-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div
                role="status"
                className="mb-4 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] p-3 text-sm text-emerald-200"
              >
                Account created! Redirecting to dashboard...
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">
                  Full name <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-11 w-full rounded-lg border border-white/10 bg-[#060d17] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-200/10"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-email"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Email address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.org"
                  className="h-11 w-full rounded-lg border border-white/10 bg-[#060d17] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-200/10"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-11 w-full rounded-lg border border-white/10 bg-[#060d17] px-3.5 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-200/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="h-11 w-full rounded-lg border border-white/10 bg-[#060d17] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-200/10"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || isLoading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-200 px-4 text-sm font-semibold text-slate-950 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <p className="mt-6 border-t border-white/[0.08] pt-5 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-cyan-200 hover:text-white">
                Sign in
              </Link>
            </p>
          </div>
          <p className="mt-4 text-center text-xs leading-5 text-slate-600">
            By joining, remember that prototypes are for exploration and require independent
            verification.
          </p>
        </div>
      </section>
    </main>
  );
}
