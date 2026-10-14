import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Be_Vietnam_Pro } from "next/font/google";
import { CampaignProvider } from "@/campaign/campaign-context";
import { PreviewProvider } from "@/preview/preview-context";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  title: "Affiliate Traffic OS",
  description: "Internal operating system for UK affiliate publishing.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={`${beVietnam.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <CampaignProvider>
          <PreviewProvider>{children}</PreviewProvider>
        </CampaignProvider>
      </body>
    </html>
  );
}
