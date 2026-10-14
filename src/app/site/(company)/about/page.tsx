import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "AffiGrove Media Group is an independent digital media company. Registration and contact details are still awaiting approval.",
};

const PENDING = [
  "Registered company number",
  "Registered office",
  "VAT number, if any",
  "Public email address",
  "Public telephone number",
  "Postal address",
  "Names of directors approved for publication",
  "Governing law and courts",
];

export default function AboutPage() {
  return (
    <article className="grove-prose">
      <p className="grove-kicker">About us</p>
      <h1>The company, as far as it can be stated.</h1>
      <p className="grove-lede">
        AffiGrove Media Group is an independent digital media company focused on engaging content, audience experiences and thoughtful commercial partnerships.
      </p>
      <section className="grove-section">
        <h2>Purpose</h2>
        <p>
          The company exists to create engaging digital media, understand audiences, and develop partnerships that are relevant and considered. A person remains responsible for what is published.
        </p>
        <p>
          The intended public addresses are affigrove.io and www.affigrove.io. Work that is not ready for the public stays off this website.
        </p>
      </section>
      <section className="grove-section">
        <h2>What we will not imply</h2>
        <p>
          This site does not list clients, staff numbers, offices, awards, or revenue. Those facts are absent because they have not been approved for publication, not because a visitor should invent them.
        </p>
        <p>AffiGrove does not offer a consumer service from these pages, and a message sent here is not a contract.</p>
      </section>
      <section className="grove-pending">
        <h2>Awaiting approval</h2>
        <p>The owner still needs to supply these facts before they can appear on the site.</p>
        <ul>
          {PENDING.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
