import type { Metadata, Viewport } from 'next'
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { outfit, inter } from "./fonts";

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}


export const metadata: Metadata = {
  title: "Open Polityra",
  description:
    "Independent open-source research and strategic intelligence platform. Analysis across economics, geopolitics, security, and resilience.",
  applicationName: "Open Polityra",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Open Polityra",
  },
  formatDetection: {
    telephone: false,
  },
  robots: "index, follow",
  metadataBase: new URL("https://polityra.vercel.app"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>

      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0a1628] dark:text-slate-100">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
