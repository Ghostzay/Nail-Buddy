import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Fraunces } from "next/font/google";
import "./globals.css";

import { MotionProvider } from "@/components/providers/motion-provider";
import {
  PreferencesProvider,
  themeInitScript,
} from "@/components/providers/preferences-provider";
import { Toaster } from "@/components/ui/sonner";

/**
 * Both faces were verified against the Google Fonts CSS API to ship the
 * `vietnamese` subset — Fraunces returns latin, latin-ext, vietnamese, so the
 * brief's "fall back to Be Vietnam Pro for Vietnamese headings" contingency
 * is not needed. Diacritics render in Fraunces headings.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "vietnamese"],
  axes: ["SOFT"],
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nail Buddy",
  description: "Walk-in check-in, tech queue, and manager dashboard.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF7F4" },
    { media: "(prefers-color-scheme: dark)", color: "#171018" },
  ],
  // The kiosk is a fixed-size tablet; zoom is handled by the larger-text
  // toggle instead. maximumScale is deliberately omitted — pinch-zoom stays
  // available, since disabling it is a WCAG 1.4.4 failure.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${beVietnam.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <PreferencesProvider>
          <MotionProvider>
            {children}
            <Toaster position="top-center" richColors />
          </MotionProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
