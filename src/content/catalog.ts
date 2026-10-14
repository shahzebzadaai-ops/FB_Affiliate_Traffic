import catalog from "@/content/plan.generated.json";
import { contentRecordSchema, importReportSchema, type ContentRecord, type ImportReport } from "@/domain/types";

export const contentRecords: ContentRecord[] = catalog.records.map((record) =>
  contentRecordSchema.parse(record),
);
export const importReport: ImportReport = importReportSchema.parse(catalog.report);

export function recordById(contentId: string): ContentRecord | undefined {
  return contentRecords.find((record) => record.contentId === contentId);
}
