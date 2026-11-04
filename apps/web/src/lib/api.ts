import { ApiClient } from "@open-polityra/api-client";
import type { ApiSuccess, ApiList, ApiError } from "@open-polityra/contracts";

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
export async function fetchSources(params?: { page?: number; pageSize?: number; query?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));
  if (params?.query) query.set("q", params.query);

  return api.get<ApiList<{ id: string; name: string; type: string; url?: string }>>(`/api/sources?${query}`);
}

/**
 * Fetch analysis reports (paginated).
 */
export async function fetchReports(params?: { page?: number; pageSize?: number; status?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));
  if (params?.status) query.set("status", params.status);

  return api.get<ApiList<{ id: string; title: string; status: string; domain: string }>>(`/api/reports?${query}`);
}

/**
 * Submit an analysis request.
 */
export async function createAnalysisRequest(payload: {
  sourceIds: string[];
  parameters: Record<string, unknown>;
}): Promise<ApiSuccess<{ analysisId: string }>> {
  return api.post("/api/analysis", payload);
}

/**
 * Fetch a single source by UUID.
 */
export async function fetchSource(id: string) {
  return api.get<{ id: string; name: string; type: string; metadata: Record<string, unknown> }>(`/api/sources/${id}`);
}
