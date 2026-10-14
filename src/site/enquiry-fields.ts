export const CONTACT_TOPICS = ["General", "Partnership", "Press", "Privacy request"] as const;
export const CAREERS_TOPICS = ["Employment enquiry", "Internship enquiry"] as const;

export type EnquiryKind = "contact" | "careers";

export function topicsFor(kind: EnquiryKind): readonly string[] {
  return kind === "careers" ? CAREERS_TOPICS : CONTACT_TOPICS;
}
