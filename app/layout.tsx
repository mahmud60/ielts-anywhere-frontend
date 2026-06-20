import type { ReactNode } from "react";
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
