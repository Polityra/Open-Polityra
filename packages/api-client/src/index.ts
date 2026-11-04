/**
 * Typed API client for Open Polityra backend services.
 */

export interface ApiClientOptions {
  baseUrl?: string
  token?: string
  timeout?: number
}

interface ResolvedApiClientOptions {
  baseUrl: string
  token: string | undefined
  timeout: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const defaultOptions: ResolvedApiClientOptions = {
  baseUrl: typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
    : 'http://localhost:4000',
  token: undefined,
  timeout: 30_000,
}

export class ApiClient {
  private baseUrl: string
  private token?: string
  private timeout: number

  constructor(options: ApiClientOptions = {}) {
    const opts = { ...defaultOptions, ...options }
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '')
    this.token = opts.token
    this.timeout = opts.timeout
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...extra,
    }
    if (this.token) {
      headers['Authorization'] = 'Bearer ' + this.token
    }
    return headers
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = this.baseUrl + path
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), this.timeout)

    try {
      const res = await fetch(url, {
        ...init,
        headers: this.buildHeaders(init?.headers as Record<string, string>),
        signal: controller.signal,
      })
      clearTimeout(id)

      const body: unknown = await res.json().catch(() => null)

      if (!res.ok) {
        const response = isRecord(body) ? body : {}
        const error = isRecord(response.error) ? response.error : response
        throw new ApiError(
          typeof error.code === 'string' ? error.code : 'api_error',
          typeof error.message === 'string' ? error.message : 'Request failed',
          res.status,
        )
      }

      if (isRecord(body) && body.ok === true && 'data' in body) {
        return body.data as T
      }

      return body as T
    } catch (err: unknown) {
      clearTimeout(id)
      if (err instanceof ApiError) throw err
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError('timeout', 'Request timed out', 0)
      }
      throw new ApiError('network_error', (err as Error).message ?? 'Network error', 0)
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path)
  }

  post<T, B>(path: string, body: B): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  patch<T, B>(path: string, body: B): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(code + ': ' + message)
    this.name = 'ApiError'
  }
}

/* ── Backend Envelope Types ─────────────────────────────────── */

export interface ApiEnvelope<T> {
  ok: true
  data: T
  meta?: { requestId?: string; timestamp?: string }
}

export interface ApiErrorEnvelope {
  ok: false
  error: { code: string; message: string; details?: unknown }
  meta?: { timestamp?: string }
}

/* ── Domain Types ───────────────────────────────────────────── */

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { email: string; password: string; name?: string; role?: 'admin' | 'editor' | 'analyst' | 'viewer' }
export interface AuthResult { user: { id: string; email: string; name: string | null; role: string; is_active: boolean }; token: string }

export interface UserRow {
  id: string; email: string; name: string | null; role: string; is_active: boolean; created_at: string; updated_at: string
}

export interface SourceRow {
  id: string; name: string; publisher: string | null; license: string | null; data_type: string; category: string; canonical_url: string | null; metadata: Record<string, unknown> | null; is_active: boolean; created_at: string; updated_at: string
}

export interface DatasetRow { id: string; name: string; format: string; size_bytes: number | null; source_id: string; created_at: string }

export interface IndicatorRow { id: string; name: string; category: string; unit: string | null; frequency: string | null; description: string | null; source_id: string; created_at: string }

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed'
export interface AnalysisRow { id: string; user_id: string; status: AnalysisStatus; parameters: Record<string, unknown> | null; result_id: string | null; error_message: string | null; created_at: string; updated_at: string }

export interface ScenarioRow { id: string; name: string; description: string | null; assumptions: Record<string, unknown> | null; parameters: Record<string, unknown> | null; created_by: string; created_at: string }

export type ReportStatus = 'draft' | 'reviewing' | 'published'
export interface ReportRow { id: string; user_id: string; title: string; status: ReportStatus; format: string; content: Record<string, unknown> | null; created_at: string }

export interface ForecastRow { id: string; analysis_id: string; target: string; method: string; values: Record<string, unknown> | null; confidence_lower: number | null; confidence_upper: number | null; created_at: string }

export interface ModelRegistryRow { id: string; name: string; provider: string; version: string; capabilities: Record<string, unknown> | null; limitations: string[] | null; license: string | null; is_active: boolean; created_at: string }

export interface NotificationRow { id: string; user_id: string; type: string; title: string; message: string; is_read: boolean; created_at: string }

export interface AuditLogRow { id: string; user_id: string; action: string; resource_type: string; details: Record<string, unknown> | null; ip_address: string | null; created_at: string }

export interface FiscalObservation { year: number; balance_pct_gdp: number; debt_pct_gdp: number }
export interface FiscalDataset {
  dataset: string;
  title: string;
  source: {
    publisher: string;
    dataset_id: string;
    url: string;
    license: string;
    license_url: string;
    geography: string;
    frequency: string;
    unit: string;
    sector: string;
    retrieved_at: string;
    last_updated: string;
  };
  indicators: {
    balance_pct_gdp: { code: string; label: string; interpretation: string };
    debt_pct_gdp: { code: string; label: string };
  };
  observations: FiscalObservation[];
  limitations: string[];
}
export interface FiscalScenarioRequest {
  projectionYears: number;
  stressAnnualBalanceChange: number;
  stressNominalGdpGrowth: number;
  stressEffectiveInterest: number;
}
export interface FiscalScenario {
  id: 'baseline' | 'stress' | 'improvement';
  name: string;
  description: string;
  assumptions: {
    annual_balance_change_pp: number;
    nominal_gdp_growth_percent: number;
    effective_interest_rate_percent: number;
  };
  values: FiscalObservation[];
}
export interface FiscalAnalysis {
  research_question: string;
  source: FiscalDataset['source'];
  indicators: FiscalDataset['indicators'];
  history: FiscalObservation[];
  latest: FiscalObservation;
  projection: { years: number; method: string; scenarios: FiscalScenario[] };
  limitations: string[];
  is_forecast: false;
}

export type AiWorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type AiWorkflowType = 'economic-analysis' | 'geopolitical-assessment' | 'scenario-generation' | 'text-summary' | 'forecast' | 'custom'

export interface AiWorkflowRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: AiWorkflowType;
  status: AiWorkflowStatus;
  model: string;
  provider: string;
  system_prompt: string | null;
  parameters: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTaskRow {
  id: string;
  workflow_id: string;
  title: string;
  description: string | null;
  step_order: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  prompt: string | null;
  response: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OllamaHealthStatus {
  available: boolean;
  models: string[];
  modelAvailable: boolean;
  available_models?: Array<{ name: string; model: string; size: number; digest: string; format: string; family: string; parameter_size: string }>;
}

export interface PaginatedMeta { total: number; limit: number; offset: number }

/* ── API Client Method Layer ────────────────────────────────── */

const _config: ResolvedApiClientOptions = { baseUrl: defaultOptions.baseUrl, token: undefined, timeout: defaultOptions.timeout }

function _buildClient(): ApiClient {
  return new ApiClient({ baseUrl: _config.baseUrl, token: _config.token, timeout: _config.timeout })
}

export const api = {
  /* ── Auth ──────────────────────────────────────────────── */
  auth: {
    login(payload: LoginPayload) { return _buildClient().post<AuthResult, LoginPayload>('/api/v1/auth/login', payload) },
    register(payload: RegisterPayload) { return _buildClient().post<{ user: Omit<UserRow, 'password_hash'> }, RegisterPayload>('/api/v1/auth/register', payload) },
    logout() { return _buildClient().post<{ message?: string }, {}>('/api/v1/auth/logout', {}) },
  },

  /* ── Users ─────────────────────────────────────────────── */
  users: {
    list() { return _buildClient().get<{ users: UserRow[]; meta: PaginatedMeta }>('/api/v1/users') },
    byId(id: string) { return _buildClient().get<{ user: Omit<UserRow, 'password_hash'> }>(`/api/v1/users/${id}`) },
    updateMe(payload: { name: string }) {
      return _buildClient().patch<{ user: Omit<UserRow, 'password_hash'> }, typeof payload>('/api/v1/users/me', payload)
    },
    changePassword(payload: { currentPassword: string; newPassword: string }) {
      return _buildClient().post<{ message?: string }, typeof payload>('/api/v1/users/me/password', payload)
    },
  },

  /* ── Sources ───────────────────────────────────────────── */
  sources: {
    list(params?: { limit?: number; offset?: number; category?: string }) {
      const qs = new URLSearchParams()
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      if (params?.category) qs.set('category', params.category)
      return _buildClient().get<{ sources: SourceRow[]; meta: PaginatedMeta }>(`/api/v1/sources?${qs}`)
    },
    create(payload: { name: string; publisher?: string; license?: string; dataType: string; category: string; canonicalUrl?: string; metadata?: Record<string, unknown> }) {
      return _buildClient().post<{ source: SourceRow }, typeof payload>('/api/v1/sources', payload)
    },
    byId(id: string) { return _buildClient().get<{ source: SourceRow }>(`/api/v1/sources/${id}`) },
    update(id: string, updates: Partial<Pick<SourceRow, 'name' | 'publisher' | 'license' | 'canonical_url' | 'metadata'>>) {
      return _buildClient().patch<{ source: SourceRow }, typeof updates>(`/api/v1/sources/${id}`, updates)
    },
    remove(id: string) { return _buildClient().delete<{ data: null }>(`/api/v1/sources/${id}`) },
  },

  /* ── Datasets ──────────────────────────────────────────── */
  datasets: {
    list(params?: { sourceId?: string; limit?: number; offset?: number }) {
      const qs = new URLSearchParams()
      if (params?.sourceId) qs.set('sourceId', params.sourceId)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return _buildClient().get<{ datasets: DatasetRow[] }>(`/api/v1/datasets?${qs}`)
    },
  },

  /* ── Indicators ────────────────────────────────────────── */
  indicators: {
    list(params?: { category?: string; limit?: number; offset?: number }) {
      const qs = new URLSearchParams()
      if (params?.category) qs.set('category', params.category)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return _buildClient().get<{ indicators: IndicatorRow[] }>(`/api/v1/indicators?${qs}`)
    },
  },

  /* ── Analyses ──────────────────────────────────────────── */
  analyses: {
    list(params?: { limit?: number; offset?: number }) {
      const qs = new URLSearchParams()
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return _buildClient().get<{ analyses: AnalysisRow[] }>(`/api/v1/analyses?${qs}`)
    },
    create(payload: { type: string; parameters: Record<string, unknown>; sourceIds?: string[] }) {
      return _buildClient().post<{ analysis: AnalysisRow }, typeof payload>('/api/v1/analyses', payload)
    },
    status(id: string) { return _buildClient().get<{ status: string; result: unknown }>(`/api/v1/analyses/${id}`) },
  },

  /* ── Scenarios ─────────────────────────────────────────── */
  scenarios: {
    list(params?: { limit?: number; offset?: number }) {
      const qs = new URLSearchParams()
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return _buildClient().get<{ scenarios: ScenarioRow[] }>(`/api/v1/scenarios?${qs}`)
    },
    create(payload: { name: string; description?: string; assumptions?: Record<string, unknown>; parameters?: Record<string, unknown> }) {
      return _buildClient().post<{ scenario: ScenarioRow }, typeof payload>('/api/v1/scenarios', payload)
    },
    byId(id: string) { return _buildClient().get<{ scenario: ScenarioRow }>(`/api/v1/scenarios/${id}`) },
  },

  /* ── Reports ───────────────────────────────────────────── */
  reports: {
    list(params?: { status?: string; limit?: number; offset?: number }) {
      const qs = new URLSearchParams()
      if (params?.status) qs.set('status', params.status)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return _buildClient().get<{ reports: ReportRow[] }>(`/api/v1/reports?${qs}`)
    },
    create(payload: { title: string; content?: Record<string, unknown> }) {
      return _buildClient().post<{ report: ReportRow }, typeof payload>('/api/v1/reports', payload)
    },
    byId(id: string) { return _buildClient().get<{ report: ReportRow }>(`/api/v1/reports/${id}`) },
  },

  /* ── Notifications ─────────────────────────────────────── */
  notifications: {
    list(params?: { limit?: number; offset?: number }) {
      const qs = new URLSearchParams()
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return _buildClient().get<{ notifications: NotificationRow[]; unread: number }>(`/api/v1/notifications?${qs}`)
    },
    markAsRead(id: string) { return _buildClient().patch<{ data: null }, {}>(`/api/v1/notifications/${id}/read`, {}) },
  },

  /* ── Audit (admin) ─────────────────────────────────────── */
  audit: {
    list(params?: { resourceType?: string; limit?: number; offset?: number }) {
      const qs = new URLSearchParams()
      if (params?.resourceType) qs.set('resourceType', params.resourceType)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return _buildClient().get<{ audit_logs: AuditLogRow[] }>(`/api/v1/audit?${qs}`)
    },
  },

  /* ── Forecasts ─────────────────────────────────────────── */
  forecasts: {
    list(params?: { analysisId?: string; limit?: number; offset?: number }) {
      const qs = new URLSearchParams()
      if (params?.analysisId) qs.set('analysisId', params.analysisId)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return _buildClient().get<{ forecasts: ForecastRow[] }>(`/api/v1/forecasts?${qs}`)
    },
  },

  /* ── Fiscal balance research prototype ─────────────────── */
  fiscalBalance: {
    data() {
      return _buildClient().get<FiscalDataset>('/api/v1/research/fiscal-balance/data')
    },
    analyze(payload: FiscalScenarioRequest) {
      return _buildClient().post<FiscalAnalysis, FiscalScenarioRequest>(
        '/api/v1/research/fiscal-balance/analyze',
        payload,
      )
    },
  },

  /* ── Model Registry ────────────────────────────────────── */
  models: {
    list(params?: { active?: boolean; limit?: number; offset?: number }) {
      const qs = new URLSearchParams()
      if (params?.active !== undefined) qs.set('active', String(params.active))
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return _buildClient().get<{ models: ModelRegistryRow[] }>(`/api/v1/model-registry?${qs}`)
    },
    byId(id: string) { return _buildClient().get<{ model: ModelRegistryRow }>(`/api/v1/model-registry/${id}`) },
  },

  /* ── AI Workflows ─────────────────────────────────────── */
  aiWorkflows: {
    list(params?: { status?: string; type?: AiWorkflowType; limit?: number; offset?: number }) {
      const qs = new URLSearchParams()
      if (params?.status) qs.set('status', params.status)
      if (params?.type) qs.set('type', params.type)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return _buildClient().get<{ workflows: AiWorkflowRow[]; meta: PaginatedMeta }>(`/api/v1/ai-workflows?${qs}`)
    },
    create(payload: { title: string; description?: string; type: AiWorkflowType; model?: string; systemPrompt?: string; parameters: Record<string, unknown> }) {
      return _buildClient().post<{ workflow: AiWorkflowRow; tasks: WorkflowTaskRow[]; result: { workflowId: string; status: string; tasksCompleted: number; totalTasks: number } }, typeof payload>('/api/v1/ai-workflows', payload)
    },
    byId(id: string) { return _buildClient().get<{ workflow: AiWorkflowRow; tasks: WorkflowTaskRow[] }>(`/api/v1/ai-workflows/${id}`) },
    cancel(id: string) { return _buildClient().delete<{ message: string }>(`/api/v1/ai-workflows/${id}`) },
  },

  /* ── AI Health ─────────────────────────────────────────── */
  aiHealth() { return _buildClient().get<OllamaHealthStatus>('/api/v1/ai-health') },

  /* ── Health ────────────────────────────────────────────── */
  health() { return _buildClient().get<{ status: string }>('/health') },
}

/**
 * Re-initialize the API client with new credentials or settings.
 * Call this after login to inject the auth token into all subsequent requests.
 */
export function init(options?: ApiClientOptions): void {
  if (options && Object.prototype.hasOwnProperty.call(options, 'token')) {
    _config.token = options.token
  }
  if (options?.baseUrl) _config.baseUrl = options.baseUrl
  if (options?.timeout) _config.timeout = options.timeout
}
