import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "AffiGrove Media Group" },
  description:
    "AffiGrove Media Group builds digital publishing and affiliate marketing through audience research, original content, technology, and performance marketing.",
};

export default function HomePage() {
  return (
    <>
      <section className="grove-hero">
        <div>
          <p className="grove-kicker">AffiGrove Media Group</p>
          <h1>Publishing, researched properly.</h1>
          <p className="grove-lede">
            AffiGrove Media Group is building a digital media company. The work is audience research, original content, the technology that supports it, and performance marketing.
          </p>
          <div className="grove-actions">
            <Link className="grove-button" href="/site/what-we-do">
              What we do
            </Link>
            <Link className="grove-button-quiet" href="/site/contact">
              Contact
            </Link>
          </div>
        </div>
        <aside className="grove-panel" aria-label="The four parts of the work">
          <p className="grove-kicker">The work</p>
          <ol>
            <li>Audience research</li>
            <li>Original content</li>
            <li>Technology</li>
            <li>Performance marketing</li>
          </ol>
          <svg className="grove-drawing" viewBox="0 0 320 90" role="img" aria-label="Three rising marks, the AffiGrove grove sign">
            <path d="M40 78V28M160 78V12M280 78V40" fill="none" stroke="#f4f0e7" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </aside>
      </section>
      <section className="grove-practices" aria-label="Practices">
        <article className="grove-card">
          <span>01</span>
          <h2>Know the audience first</h2>
          <p>A publication starts from who it is for. Research comes before the company treats a property as ready.</p>
        </article>
        <article className="grove-card">
          <span>02</span>
          <h2>Make the work original</h2>
          <p>Writing, design, and video are produced for the publication. This site does not present fiction as a customer’s experience.</p>
        </article>
        <article className="grove-card">
          <span>03</span>
          <h2>Use technology in the open</h2>
          <p>Software helps the team plan, review, and measure its own work. The private tools stay off this website.</p>
        </article>
        <article className="grove-card">
          <span>04</span>
          <h2>Measure what was collected</h2>
          <p>Affiliate partnerships and paid distribution follow a person’s approval. Public claims wait for results that were actually collected.</p>
        </article>
      </section>
      <section className="grove-section">
        <h2>What this website will say</h2>
        <p>
          The public site explains the company. It does not describe private operations, unpublished figures, or plans that have not been approved for release.
        </p>
        <dl className="grove-facts">
          <div>
            <dt>Company</dt>
            <dd>AffiGrove Media Group</dd>
          </div>
          <div>
            <dt>Public addresses</dt>
            <dd>affigrove.io and www.affigrove.io</dd>
          </div>
          <div>
            <dt>Work</dt>
            <dd>Research, original content, technology, and performance marketing</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
