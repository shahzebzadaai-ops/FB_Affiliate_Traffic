import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How AffiGrove Media Group handles messages sent through this website. The site does not run advertising or analytics cookies.",
};

export default function PrivacyPage() {
  return (
    <article className="grove-prose">
      <p className="grove-kicker">Privacy policy</p>
      <h1>What this site keeps.</h1>
      <p className="grove-lede">Last updated 14 October 2026. This policy covers affigrove.io, www.affigrove.io, and the local preview of those pages.</p>
      <section className="grove-section">
        <h2>Who is responsible</h2>
        <p>
          The controller named on this site is AffiGrove Media Group. A registered office and a public email address have not been approved. Until they are, send a privacy request through the <Link href="/site/contact">contact form</Link> and choose “Privacy request”.
        </p>
      </section>
      <section className="grove-section">
        <h2>What the forms collect</h2>
        <p>The contact and careers forms store the name, email address, subject, and message you submit, and the time of submission.</p>
        <p>
          The server also stores a hash of the network address used for the request. The address itself is not written into the enquiry record. The hash is used to limit repeated submissions. A hidden fax field is ignored and is not stored.
        </p>
      </section>
      <section className="grove-section">
        <h2>What this site does not do</h2>
        <p>
          These pages do not set analytics cookies, advertising cookies, or a public user account. They do not sell enquiry data. They do not ask for payment details, identity documents, or files.
        </p>
      </section>
      <section className="grove-section">
        <h2>Who can read a message</h2>
        <p>
          Messages are stored in the company’s private database. They can be read by staff authorised to manage enquiries. They are not published on this website. The private staff system is separate and is not open to visitors.
        </p>
      </section>
      <section className="grove-section">
        <h2>How long messages are kept</h2>
        <p>
          A deletion period has not been approved. Messages are kept so the company can respond. A privacy request can ask for deletion. There is no self-serve delete button yet.
        </p>
      </section>
      <section className="grove-section">
        <h2>Children</h2>
        <p>This website is a company site. It is not a service for children, and the forms are not intended for anyone under 18.</p>
      </section>
      <section className="grove-section">
        <h2>Hosting</h2>
        <p>
          This copy is for local review. The public launch, and the name of any hosting company that will process these messages, will be added when the owner approves the launch. Do not treat this preview as a live service.
        </p>
      </section>
    </article>
  );
}
