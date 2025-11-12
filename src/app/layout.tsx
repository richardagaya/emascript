import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Akavanta",
  description: "Forex Trading EAs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
