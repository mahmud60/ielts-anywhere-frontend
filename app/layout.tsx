import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/AuthContext";
import { LanguageProvider } from "@/lib/i18n";
import PostHogProvider from "@/components/PostHogProvider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ieltsanywhere.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "IELTSAnywhere — AI-Powered IELTS Practice & Mock Tests",
    template: "%s · IELTSAnywhere",
  },
  description:
    "Practice all four IELTS modules — Listening, Reading, Writing and Speaking — with realistic, exam-style tests and instant AI band scores and feedback. Track your progress toward your target band, anytime, anywhere.",
  applicationName: "IELTSAnywhere",
  keywords: [
    "IELTS", "IELTS practice", "IELTS preparation", "IELTS mock test",
    "IELTS speaking test", "IELTS writing", "IELTS reading", "IELTS listening",
    "AI band score", "IELTS feedback", "online IELTS practice",
  ],
  authors: [{ name: "IELTSAnywhere" }],
  creator: "IELTSAnywhere",
  openGraph: {
    type: "website",
    siteName: "IELTSAnywhere",
    url: SITE_URL,
    title: "IELTSAnywhere — AI-Powered IELTS Practice & Mock Tests",
    description:
      "Realistic IELTS tests across all four modules with instant AI band scores and feedback. Track your progress and hit your target band.",
  },
  twitter: {
    card: "summary_large_image",
    title: "IELTSAnywhere — AI-Powered IELTS Practice",
    description:
      "Practice IELTS Listening, Reading, Writing & Speaking with instant AI band scores and feedback.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} font-sans`}>
        <PostHogProvider>
          <AuthProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
