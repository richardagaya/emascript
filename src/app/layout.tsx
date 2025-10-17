import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EA Trading Bots | Automated Forex EAs",
  description:
    "High-performance Expert Advisors (EAs) for automated Forex trading. Backtested strategies, risk controls, and easy onboarding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <main>{children}</main>
        <footer className="mt-16 border-t border-black/[.08] dark:border-white/[.145]">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-black/70 dark:text-white/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} EA Bots. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#terms" className="hover:underline">Terms</a>
              <a href="#privacy" className="hover:underline">Privacy</a>
              <a href="mailto:support@example.com" className="hover:underline">Support</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
