import { ApiClient } from "@open-polityra/api-client";

/**
 * Shared API client instance. Configure via NEXT_PUBLIC_API_URL or NEXTAUTH_TOKEN environment variables.
 */
export const api = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  token: process.env.NEXTAUTH_TOKEN,
});

/**
 * Fetch all sources (paginated). Returns the deserialized response body.
 */
export async function fetchSources(params?: { category?: string; limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  return api.get<{ sources: { id: string; name: string; category: string; canonical_url?: string }[]; meta: { total: number; limit: number; offset: number } }>(`/api/v1/sources?${query}`);
}

/**
 * Fetch analysis reports (paginated).
 */
export async function fetchReports(params?: { limit?: number; offset?: number; status?: string }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  if (params?.status) query.set("status", params.status);

  return api.get<{ reports: { id: string; title: string; status: string }[] }>(`/api/v1/reports?${query}`);
}

/**
 * Submit an analysis request.
 */
export async function createAnalysisRequest(payload: {
  type: "economic-forecast" | "scenario-simulation" | "statistical-summary" | "text-analysis";
  sourceIds: string[];
  parameters: Record<string, unknown>;
}) {
  return api.post<{ analysis: { id: string; status: string } }, typeof payload>("/api/v1/analyses", payload);
}

/**
 * Fetch a single source by UUID.
 */
export async function fetchSource(id: string) {
  return api.get<{ source: { id: string; name: string; category: string; metadata: Record<string, unknown> | null } }>(`/api/v1/sources/${encodeURIComponent(id)}`);
}
