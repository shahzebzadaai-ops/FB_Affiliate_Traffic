import { z } from "zod";

export const PAGE_CODES = ["BGUK", "AHSUK", "SPSUK", "SGIUK", "CBCUK"] as const;
export const pageCodeSchema = z.enum(PAGE_CODES);
export type PageCode = z.infer<typeof pageCodeSchema>;

export const FORMATS = ["REEL", "IMAGE_POST", "TEXT_POST", "POLL", "CAROUSEL"] as const;
export const formatSchema = z.enum(FORMATS);
export type ContentFormat = z.infer<typeof formatSchema>;

export const TASK_STATUSES = [
  "PLANNED",
  "ASSIGNED",
  "IN_PROGRESS",
  "READY_FOR_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "METRICS_DUE",
  "PERFORMANCE_RECORDED",
  "CANCELLED",
] as const;
export const taskStatusSchema = z.enum(TASK_STATUSES);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "CONTENT_MANAGER",
  "CONTENT_OPERATOR",
  "DESIGNER",
  "VIDEO_EDITOR",
  "AFFILIATE_MANAGER",
  "ANALYST",
] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const contentRecordSchema = z.object({
  contentId: z.string().regex(/^UK-(BGUK|AHSUK|SPSUK|SGIUK|CBCUK)-\d{3}$/),
  sourceId: z.string().regex(/^(BGUK|AHSUK|SPSUK|SGIUK|CBCUK)-\d{3}$/),
  countryCode: z.string().min(2),
  pageCode: pageCodeSchema,
  persona: z.string().min(8),
  pillar: z.string().min(2),
  angle: z.string().min(8),
  hook: z.string().min(8),
  priority: z.boolean(),
  format: formatSchema,
  creativeBrief: z.string().min(40),
  sourceBrief: z.string().min(20),
  scriptRequirements: z.string().min(10),
  imageInstructions: z.string().min(10),
  reelScenes: z.string().min(10).nullable(),
  captionInstructions: z.string().min(10),
  engagementQuestion: z.string().min(8),
  expectedReaction: z.string().min(8),
  assigneeId: z.string().min(2),
  reviewerId: z.string().min(2),
  dueAt: z.string().datetime(),
  publishAt: z.string().datetime(),
  approvalStatus: z.literal("NOT_SUBMITTED"),
  assetRequirements: z.array(z.string().min(3)).min(1),
  publicationStatus: z.literal("UNPUBLISHED"),
  performanceCheckpoints: z.tuple([z.literal("24h"), z.literal("72h"), z.literal("7d")]),
  cta: z.string().min(3),
  week: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  monetisation: z.enum(["none", "guide_bridge_if_ready"]),
  driveFolderPath: z.string().min(10),
  unresolved: z.array(z.string()),
  voiceoverStyle: z.string().min(8),
  duration: z.string().nullable(),
});

export type ContentRecord = z.infer<typeof contentRecordSchema>;

export const importReportSchema = z.object({
  expectedRecords: z.literal(180),
  parsedRows: z.number().int(),
  successfullyImported: z.number().int(),
  duplicates: z.array(z.string()),
  missingFields: z.array(
    z.object({
      sourceId: z.string(),
      fields: z.array(z.string()),
    }),
  ),
  unresolved: z.array(
    z.object({
      contentId: z.string(),
      sourceId: z.string(),
      reasons: z.array(z.string()),
    }),
  ),
  formatMixByPage: z.record(z.string(), z.record(z.string(), z.number())),
  allocationNote: z.string().min(20),
});

export type ImportReport = z.infer<typeof importReportSchema>;
