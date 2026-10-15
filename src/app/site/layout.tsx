import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { PublicBody } from "@/components/site-shell";
import "../cinematic.css";

const serif = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500", "600"],
  variable: "--font-grove-serif",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-grove-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://affigrove.io"),
  title: {
    default: "AffiGrove Media Group",
    template: "%s · AffiGrove Media Group",
  },
  description:
    "Discover AffiGrove Media Group, an independent digital media company bringing storytelling, engaging experiences and thoughtful partnerships together.",
  applicationName: "AffiGrove Media Group",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/brand/favicon.ico" },
      { url: "/brand/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  manifest: "/brand/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#111B16",
};

const motionFlag = `(function(){try{document.body.classList.add("grove-open");var motion=window.matchMedia("(prefers-reduced-motion: reduce)");if(!motion.matches)document.documentElement.classList.add("cine-motion");}catch(e){}})();`;

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${serif.variable} ${sans.variable}`}>
      <script dangerouslySetInnerHTML={{ __html: motionFlag }} />
      <PublicBody />
      {children}
    </div>
  );
}
