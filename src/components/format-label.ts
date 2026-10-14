import type { ContentRecord } from "@/domain/types";

const FORMAT_LABEL = {
  REEL: "Reel",
  IMAGE_POST: "Image post",
  TEXT_POST: "Text post",
  POLL: "Poll",
  CAROUSEL: "Carousel",
} as const;

export function formatLabel(format: ContentRecord["format"]): string {
  return FORMAT_LABEL[format];
}
