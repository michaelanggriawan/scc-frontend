import type { Metadata } from "next";
// Self-hosted fonts (bundled, no build-time network). We deliberately avoid
// next/font/google here: it downloads the fonts from fonts.googleapis.com at
// build time, which fails in sandboxed CI/deploy builds (e.g. Railway).
import "@fontsource-variable/outfit";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "SCC Venue — Serpong Convention Center",
  description:
    "Book the Serpong Convention Center: a column-free, gold-standard venue for conferences, exhibitions, summits, and live productions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full">
      <body className="min-h-full flex flex-col bg-mahogany-2">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
