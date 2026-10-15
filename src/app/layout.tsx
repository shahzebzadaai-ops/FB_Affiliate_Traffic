import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { CampaignProvider } from "@/campaign/campaign-context";
import { GalaxyBackdrop } from "@/components/galaxy-backdrop";
import { PreviewProvider } from "@/preview/preview-context";
import "./fonts.css";
import "./globals.css";
import "./grove.css";

export const metadata: Metadata = {
  title: "AffiGrove OS",
  description: "AffiGrove OS is the internal operating system for UK affiliate publishing.",
  applicationName: "AffiGrove OS",
  icons: {
    icon: [
      { url: "/brand/os-favicon.ico" },
      { url: "/brand/os-favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/os-favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/brand/os-apple-touch-icon.png",
  },
  manifest: "/brand/os.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#111B16",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <GalaxyBackdrop />
        <div className="relative z-10 min-h-full">
          <CampaignProvider>
            <PreviewProvider>{children}</PreviewProvider>
          </CampaignProvider>
        </div>
      </body>
    </html>
  );
}
