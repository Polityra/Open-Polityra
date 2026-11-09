import type { Metadata } from "next";
import ogImage from "@/app/og-image.png";

/** Public repository. Override with NEXT_PUBLIC_REPO_URL if it moves. */
export const REPO_URL =
  process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/Polityra/Open-Polityra";

export const SITE_NAME = "Open Polityra";
export const SITE_URL = "https://polityra.vercel.app";
export const OG_IMAGE = ogImage.src;
export const DEFAULT_DESCRIPTION =
  "An independent, open-source research platform for examining public data across economics, geopolitics, security, resilience, and governance—with transparent methods, sources, and uncertainty.";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
};

export function createPageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [{ url: OG_IMAGE, alt: "Open Polityra research platform" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
