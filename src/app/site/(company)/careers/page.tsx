import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "AffiGrove Media Group will recruit employees and consider internship enquiries. No vacancy is listed until the owner approves it.",
};

export default function CareersPage() {
  return (
    <article className="grove-prose">
      <p className="grove-kicker">Careers</p>
      <h1>Future colleagues.</h1>
      <p className="grove-lede">
        AffiGrove Media Group expects to hire employees and to hear from people interested in internships. No vacancy is listed on this page because none has been approved for publication.
      </p>
      <section className="grove-section">
        <h2>What an enquiry is</h2>
        <p>
          The form stores your name, email, subject, and message so authorised staff can read them. Sending it does not create an application file, an interview, or an employment contract.
        </p>
        <p>
          Pay, hours, location, and internship terms are not published. An internship is not described as unpaid or paid here, because that statement has not been approved and the lawful terms have to be settled before they are offered.
        </p>
      </section>
      <section className="grove-pending">
        <h2>Awaiting approval</h2>
        <ul>
          <li>Open roles, if any</li>
          <li>Whether internships will be offered, and on what terms</li>
          <li>Work location or remote policy</li>
          <li>A public recruitment email</li>
        </ul>
      </section>
      <EnquiryForm kind="careers" />
    </article>
  );
}
