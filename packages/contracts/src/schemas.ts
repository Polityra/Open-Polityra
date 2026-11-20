/**
 * Shared data schemas used across Open Polityra services.
 */

import { z } from "zod";

export const PaginatedResponseSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const TimestampedEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export const SourceMetadataSchema = z.object({
  publisher: z.string(),
  url: z.string().url().optional(),
  license: z.string().optional(),
  retrievalDate: z.string().date().optional(),
  description: z.string().optional(),
});

export const ClaimVerificationStatusSchema = z.enum([
  "unverified",
  "supported",
  "corroborated",
  "contradicted",
  "disputed",
  "insufficient_evidence",
  "under_review",
]);

export const EvidenceReferenceSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  claimId: z.string().uuid(),
  stance: z.enum(["supports", "contradicts", "context"]),
  quote: z.string().min(1),
  sourceStart: z.number().int().nonnegative(),
  sourceEnd: z.number().int().positive(),
  dependencyRoot: z.string().uuid().nullable().optional(),
  relevance: z.number().min(0).max(1),
  matchMethod: z.string(),
});

export const ExtractedClaimSchema = z.object({
  documentId: z.string().uuid(),
  text: z.string().min(1),
  subject: z.string().nullable(),
  predicate: z.string(),
  object: z.string().nullable(),
  claimType: z.string(),
  sourceStart: z.number().int().nonnegative(),
  sourceEnd: z.number().int().positive(),
  extractionModel: z.string(),
  extractionConfidence: z.number().min(0).max(1),
});

export const PipelineJobSchema = z.object({
  contractVersion: z.literal(1),
  jobType: z.enum([
    "source.fetch",
    "document.normalize",
    "document.deduplicate",
    "document.extract_claims",
    "document.extract_entities",
    "document.extract_events",
    "claim.find_evidence",
    "claim.verify",
    "claim.detect_contradictions",
    "analysis.create",
    "analysis.update",
  ]),
  idempotencyKey: z.string().min(1),
  correlationId: z.string().uuid(),
  payload: z.record(z.string(), z.unknown()),
});

export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>;
export type TimestampedEntity = z.infer<typeof TimestampedEntitySchema>;
export type SourceMetadata = z.infer<typeof SourceMetadataSchema>;
export type ClaimVerificationStatus = z.infer<typeof ClaimVerificationStatusSchema>;
export type EvidenceReference = z.infer<typeof EvidenceReferenceSchema>;
export type ExtractedClaim = z.infer<typeof ExtractedClaimSchema>;
export type PipelineJobContract = z.infer<typeof PipelineJobSchema>;
