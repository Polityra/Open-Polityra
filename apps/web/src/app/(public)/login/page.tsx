import type { Metadata } from "next";
import { Suspense } from "react";
import { createPageMetadata } from "@/lib/site";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Sign In",
    description: "Sign in to access your Open Polityra research workspace.",
    path: "/login",
  }),
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050a12]">
          <div className="animate-pulse font-mono text-xs uppercase tracking-[0.18em] text-cyan-200">
            Loading login...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
