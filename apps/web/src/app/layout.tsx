import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { DEFAULT_DESCRIPTION, OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import { outfit, inter } from "./fonts";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Open Polityra | Open-Source Public-Interest Research",
    template: "%s | Open Polityra",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: "Open Polityra | Open-Source Public-Interest Research",
    description: DEFAULT_DESCRIPTION,
    images: [{ url: OG_IMAGE, alt: "Open Polityra research platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Polityra | Open-Source Public-Interest Research",
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
