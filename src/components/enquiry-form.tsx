"use client";

import { useState } from "react";
import { topicsFor, type EnquiryKind } from "@/site/enquiry-fields";

export function EnquiryForm({ kind }: { kind: EnquiryKind }) {
  const topics = topicsFor(kind);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const consent = form.get("consent") === "yes";
    if (!consent) {
      setError("Consent is required before a message can be stored.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/public/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          kind,
          name: form.get("name"),
          email: form.get("email"),
          topic: form.get("topic"),
          message: form.get("message"),
          consent: true,
          fax: form.get("fax"),
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error || "The message could not be stored.");
        setPending(false);
        return;
      }
      setDone(true);
    } catch {
      setError("The message could not be stored. Check the connection and try again.");
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="grove-success" role="status">
        <h2>Message stored</h2>
        <p>
          AffiGrove Media Group has stored your message for authorised staff. A public inbox is not published yet, so this form does not send an email by itself.
        </p>
      </div>
    );
  }

  return (
    <form className="grove-form" onSubmit={onSubmit} noValidate>
      <label>
        Name
        <input name="name" autoComplete="name" maxLength={80} required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" maxLength={120} required />
      </label>
      <label>
        Subject
        <select name="topic" defaultValue="" required>
          <option value="" disabled>
            Choose a subject
          </option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </label>
      <label>
        Message
        <textarea name="message" maxLength={2000} required minLength={10} />
      </label>
      <label className="grove-consent">
        <input name="consent" type="checkbox" value="yes" />
        <span>I agree that AffiGrove Media Group may store this message so authorised staff can read it and reply. The privacy policy explains what is kept.</span>
      </label>
      <div className="grove-trap" aria-hidden="true">
        <label>
          Fax
          <input name="fax" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error ? (
        <p className="grove-alert" role="alert">
          {error}
        </p>
      ) : null}
      <button className="grove-button" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send message"}
      </button>
    </form>
  );
}
