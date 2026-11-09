import { getEnv } from "../config/env";
import type { Env } from "../config/env";
import { AppError } from "../errors/appError";

export interface AnalysisRequest {
  type: "economic-forecast" | "scenario-simulation" | "statistical-summary" | "text-analysis";
  parameters: Record<string, unknown>;
  sourceIds?: string[];
}

export interface AnalysisResult {
  status: "completed" | "failed";
  data: unknown;
  confidence?: number;
  methodology?: string;
  error?: string;
}

let cachedEnv: Env | null = null;

function _getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  cachedEnv = getEnv();
  return cachedEnv;
}

export class PythonServiceClient {
  private baseUrl: string;

  constructor(env?: Env) {
    this.baseUrl = (env ?? _getEnv()).PYTHON_SERVICE_URL;
  }

  async submitAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/analyses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new AppError(res.status, "analysis_service_error", `Analysis service error: ${body}`);
    }

    return res.json() as Promise<AnalysisResult>;
  }

  async getAnalysisStatus(id: string): Promise<AnalysisResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/analyses/${id}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new AppError(res.status, "analysis_not_found", `Analysis ${id} not found`);
    }

    return res.json() as Promise<AnalysisResult>;
  }
}
