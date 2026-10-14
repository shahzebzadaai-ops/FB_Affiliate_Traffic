import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact AffiGrove Media Group through the form. A public email, phone number, and office address have not been approved.",
};

export default function ContactPage() {
  return (
    <article className="grove-prose">
      <p className="grove-kicker">Contact</p>
      <h1>Write to the company.</h1>
      <p className="grove-lede">
        Use this form for a general message, a partnership note, a press enquiry, or a privacy request. A public email address, phone number, and office address have not been approved, so they are not shown.
      </p>
      <EnquiryForm kind="contact" />
    </article>
  );
}
