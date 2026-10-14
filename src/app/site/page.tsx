import type { Metadata } from "next";
import { CinematicHome } from "@/components/public/cinematic-home";

const title = "AffiGrove Media Group | Digital Media & Meaningful Partnerships";
const description =
  "Discover AffiGrove Media Group, an independent digital media company bringing storytelling, engaging experiences and thoughtful partnerships together.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "https://affigrove.io/" },
  openGraph: {
    title,
    description,
    url: "https://affigrove.io/",
    siteName: "AffiGrove Media Group",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const identity = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AffiGrove Media Group",
  alternateName: "AffiGrove",
  url: "https://affigrove.io/",
  description,
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(identity) }} />
      <CinematicHome />
    </>
  );
}
