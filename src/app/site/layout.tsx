import { Suspense, type ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SiteShell } from "@/components/site-shell";

const serif = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-grove-serif",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-grove-sans",
});

export const metadata: Metadata = {
  title: {
    default: "AffiGrove Media Group",
    template: "%s · AffiGrove Media Group",
  },
  description:
    "AffiGrove Media Group is building a digital media publishing and affiliate marketing business through audience research, original content, technology, and performance marketing.",
  applicationName: "AffiGrove Media Group",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f3efe6",
};

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${serif.variable} ${sans.variable}`}>
      <Suspense fallback={<div className="grove"><p className="grove-kicker">Loading</p></div>}>
        <SiteShell>{children}</SiteShell>
      </Suspense>
    </div>
  );
}
