import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "./providers";
import TickerTape from "@/components/TickerTape";
import Footer from "@/components/Footer";

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
      <body className={`antialiased`}>
        <Providers>
          <Navbar />
          <div className="border-b border-black/[.08] dark:border-white/[.145]">
            <TickerTape />
          </div>
          <main>{children}</main>
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
