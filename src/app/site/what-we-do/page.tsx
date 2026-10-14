import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What We Do",
  description:
    "AffiGrove Media Group works in audience research, original content, publishing technology, and performance marketing.",
};

export default function WhatWeDoPage() {
  return (
    <article className="grove-prose">
      <p className="grove-kicker">What we do</p>
      <h1>Four kinds of work.</h1>
      <p className="grove-lede">
        The company is building a publishing and affiliate marketing business. Each part below is public. The internal method stays private.
      </p>
      <section className="grove-section">
        <h2>Audience research</h2>
        <p>
          Before a publication is treated as ready, the company studies who it is for. Research uses sources the company is allowed to use. It is not a substitute for a person’s decision.
        </p>
      </section>
      <section className="grove-section">
        <h2>Original content</h2>
        <p>
          Writing, design, and video are made for the publication. The company does not present invented stories as testimonials, and it does not describe locations or identities it has not verified.
        </p>
      </section>
      <section className="grove-section">
        <h2>Technology</h2>
        <p>
          The team uses software to plan, review, and measure its own work. Those tools are private. They are not a product offered on this website.
        </p>
      </section>
      <section className="grove-section">
        <h2>Performance marketing</h2>
        <p>
          Affiliate partnerships, and paid distribution when a budget is approved, are part of the business. A person approves spend. This site does not quote results that have not been collected, and it does not name partners that have not been approved for publication.
        </p>
        <p>
          Read <Link href="/site/approach">our approach</Link> for how those decisions are held.
        </p>
      </section>
    </article>
  );
}
