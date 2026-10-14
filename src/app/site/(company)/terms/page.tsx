import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms for using the AffiGrove Media Group website. Governing law has not been approved and is not invented here.",
};

export default function TermsPage() {
  return (
    <article className="grove-prose">
      <p className="grove-kicker">Terms and company information</p>
      <h1>Terms of this website.</h1>
      <p className="grove-lede">Last updated 14 October 2026. These terms cover the public pages of AffiGrove Media Group.</p>
      <section className="grove-section">
        <h2>Using the site</h2>
        <p>
          You may read these pages and send a message through the forms. You may not misuse the forms, attempt to enter private staff systems, or present the site as a promise of results.
        </p>
      </section>
      <section className="grove-section">
        <h2>No contract from a visit</h2>
        <p>
          Reading the site, or sending a contact or careers message, does not create employment, an internship, a partnership, or a paid engagement. Vacancies and commercial terms are published only when the owner approves them.
        </p>
      </section>
      <section className="grove-section">
        <h2>Information on the site</h2>
        <p>
          The pages state the company name and the intended public addresses. They do not state figures, clients, offices, or awards. Where a fact is missing, the page says it is awaiting approval.
        </p>
      </section>
      <section className="grove-section">
        <h2>Intellectual property</h2>
        <p>The text and the grove mark on this site belong to AffiGrove Media Group unless a page says otherwise. You may not copy them for your own brand.</p>
      </section>
      <section className="grove-section">
        <h2>Liability</h2>
        <p>
          The site is general information. To the extent the law allows, AffiGrove Media Group is not liable for decisions you make solely from that general information. This sentence does not exclude liability that the law says cannot be excluded.
        </p>
      </section>
      <section className="grove-section">
        <h2>Governing law</h2>
        <p>
          A country, governing law, and court have not been approved. These terms do not choose one. The owner must supply that choice before the site is opened to the public.
        </p>
      </section>
      <section className="grove-pending">
        <h2>Company information</h2>
        <dl className="grove-facts">
          <div>
            <dt>Name</dt>
            <dd>AffiGrove Media Group</dd>
          </div>
          <div>
            <dt>Intended addresses</dt>
            <dd>affigrove.io and www.affigrove.io</dd>
          </div>
          <div>
            <dt>Not yet supplied</dt>
            <dd>Company number, registered office, VAT, public email, phone, and governing law.</dd>
          </div>
        </dl>
        <p>
          Questions about these terms go through the <Link href="/site/contact">contact form</Link>. The <Link href="/site/privacy">privacy policy</Link> explains the forms.
        </p>
      </section>
    </article>
  );
}
