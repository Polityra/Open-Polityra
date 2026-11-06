import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Create an Account",
    description: "Create an account to access the Open Polityra research workspace.",
    path: "/register",
  }),
  robots: { index: false, follow: false },
};

export default function RegisterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
