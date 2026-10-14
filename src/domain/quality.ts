export const QUALITY_CHECKS = [
  { id: "uk-english", label: "Natural UK English", detail: "Uses mum, holiday, pub, train or city where it fits. No robotic phrasing or unnecessary Americanisms." },
  { id: "one-idea", label: "One post, one idea", detail: "The hook is understandable in two seconds." },
  { id: "original", label: "Original asset", detail: "Created for this Page. No downloaded videos, copied memes or stolen screenshots." },
  { id: "not-a-testimonial", label: "Not a fake testimonial", detail: "A fictional scenario reads as editorial. It is not presented as a real customer or follower." },
  { id: "no-humiliation", label: "No identifiable private material", detail: "No identifiable dating profiles, private messages or children's faces." },
  { id: "age-appropriate", label: "Age-appropriate", detail: "No explicit imagery, sexualised bait or objectifying language." },
  { id: "anatomy-type", label: "Image anatomy and type", detail: "Hands, faces and text look intentional. Type is readable on a phone." },
  { id: "opening", label: "Strong opening", detail: "The first two seconds, or the headline, carry the hook." },
  { id: "captions", label: "Captions and format", detail: "Reels have subtitles. The file matches the assigned format." },
  { id: "disclosure", label: "Promotion and disclosure", detail: "Weeks 1–2 have no affiliate sell. A later guide bridge is clearly advertising if a partner link is used." },
] as const;

export type QualityCheckId = (typeof QUALITY_CHECKS)[number]["id"];
