import { getEnv } from "../config/env";
import type { Env } from "../config/env";
import { AppError } from "../errors/appError";

export interface AnalysisRequest {
  topic: string;
  context?: string;
  observations?: number[];
  scope?: "global" | "regional" | "national" | "subnational" | "organization" | "topic";
  time_horizon?: number;
  methodology?: "descriptive" | "timeseries" | "forecasting" | "simulation" | "comprehensive";
  enable_ai_synthesis?: boolean;
}

export interface AnalysisResult {
  topic: string;
  summary: string;
  confidence?: number;
  methodology?: string;
  [key: string]: unknown;
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
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(90_000),
      });
    } catch (error) {
      throw new AppError(
        503,
        "analysis_service_unavailable",
        `Analysis worker is unavailable; check PYTHON_SERVICE_URL and ensure it is running: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

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
