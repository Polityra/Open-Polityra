/**
 * Frontend TypeScript type definitions for Open Polityra.
 * Domain types mirror the contracts package and extend with frontend-specific interfaces.
 */

/* ── Core API Types ─────────────────────────────────────── */

export interface ApiResponse<T = unknown> {
  ok: true;
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown[];
}

/* ── User Types ─────────────────────────────────────────── */

export interface User {
  id: string;
  email: string;
  name: string;
  role: "analyst" | "reviewer" | "admin" | "guest";
  affiliation?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserSession {
  user: User;
  expiresAt: string;
  permissions: string[];
}

/* ── Source Types ───────────────────────────────────────── */

export type SourceType = "primary" | "secondary" | "tertiary";
export type SourceStatus = "verified" | "pending" | "flagged" | "archived";

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url?: string;
  publisher?: string;
  language?: string;
  status: SourceStatus;
  metadata: Record<string, unknown>;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface SourceQueryParams {
  page?: number;
  pageSize?: number;
  query?: string;
  type?: SourceType;
  status?: SourceStatus;
  domain?: string;
}

/* ── Analysis Types ─────────────────────────────────────── */

export type AnalysisStatus = "draft" | "in_progress" | "under_review" | "published" | "archived";
export type AnalysisDomain = "economics" | "geopolitics" | "security" | "resilience" | "public_services" | "trade";

export interface AnalysisRequest {
  sourceIds: string[];
  parameters: Record<string, unknown>;
  domain?: AnalysisDomain;
  title?: string;
}

export interface Analysis {
  id: string;
  title: string;
  status: AnalysisStatus;
  domain: AnalysisDomain;
  request: AnalysisRequest;
  findings: Finding[];
  confidence: number;
  createdBy: string;
  updatedAt: string;
}

export interface Finding {
  id: string;
  claim: string;
  evidence: string[];
  confidence: "high" | "moderate" | "low";
  counterargument?: string;
}

/* ── Report Types ───────────────────────────────────────── */

export type ReportStatus = "draft" | "reviewing" | "published" | "superseded";

export interface Report {
  id: string;
  title: string;
  status: ReportStatus;
  domain: AnalysisDomain[];
  authors: string[];
  summary: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/* ── Scenario Types ─────────────────────────────────────── */

export interface Scenario {
  id: string;
  name: string;
  description: string;
  probability: number;
  impact: number;
  timeframe: string;
  indicators: Indicator[];
  createdAt: string;
}

export interface Indicator {
  id: string;
  metric: string;
  currentValue: number;
  threshold: number;
  direction: "up" | "down" | "neutral";
}

/* ── Forecast Types ─────────────────────────────────────── */

export interface Forecast {
  id: string;
  label: string;
  domain: AnalysisDomain;
  timeHorizon: string;
  projections: Projection[];
  confidenceInterval: [number, number];
  createdAt: string;
}

export interface Projection {
  date: string;
  value: number;
  lowerBound?: number;
  upperBound?: number;
}

/* ── Paginated Response ─────────────────────────────────── */

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/* ── Dashboard Types ────────────────────────────────────── */

export interface DashboardSummary {
  totalSources: number;
  activeAnalyses: number;
  publishedReports: number;
  pendingReviews: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: "analysis_complete" | "report_published" | "source_added" | "finding_confirmed";
  title: string;
  timestamp: string;
  domain?: AnalysisDomain;
}
