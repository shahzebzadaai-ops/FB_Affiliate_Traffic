import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { PreviewProvider } from "@/preview/preview-context";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "Affiliate Traffic OS",
  description: "Internal operating system for UK affiliate publishing.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={`${sourceSans.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <PreviewProvider>{children}</PreviewProvider>
      </body>
    </html>
  );
}
