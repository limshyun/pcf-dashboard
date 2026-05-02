// API fetch 유틸. 모든 응답은 { data, meta? } 또는 { error } 구조 (api-response.ts와 일치).

export interface SummaryResponse {
  rangeFrom: string | null;
  rangeTo: string | null;
  totalCo2eKg: string;
  activityCount: number;
  failureCount: number;
  scopeBreakdown: Array<{ scope: number; co2eKg: string; ratio: number }>;
}

export interface MonthlyBucket {
  yearMonth: string;
  co2eKg: string;
}

export interface CategoryBucket {
  categoryCode: string;
  co2eKg: string;
  ratio: number;
}

export interface ItemBucket {
  itemCode: string;
  co2eKg: string;
}

export interface ByMonthResponse {
  buckets: MonthlyBucket[];
}
export interface ByCategoryResponse {
  buckets: CategoryBucket[];
}
export interface ByItemResponse {
  topN: number | null;
  buckets: ItemBucket[];
}

export interface DashboardRange {
  from?: string;
  to?: string;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "")
      searchParams.set(key, String(value));
  }
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  constructor(payload: ApiErrorPayload, status: number) {
    super(payload.message);
    this.code = payload.code;
    this.status = status;
    this.details = payload.details;
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) {
    throw new ApiError(
      payload?.error ?? {
        code: "UNKNOWN",
        message: `${response.status} ${response.statusText}`,
      },
      response.status
    );
  }
  return payload.data as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new ApiError(
      payload?.error ?? {
        code: "UNKNOWN",
        message: `${response.status} ${response.statusText}`,
      },
      response.status
    );
  }
  return payload.data as T;
}

export interface DashboardData {
  summary: SummaryResponse;
  byMonth: ByMonthResponse;
  byCategory: ByCategoryResponse;
  byItem: ByItemResponse;
}

// trade-off: 같은 DB·도메인 결과라 한쪽 실패는 데이터 자체 의심 신호 → allSettled가 아닌 Promise.all 채택
export async function fetchDashboard(
  range: DashboardRange = {},
  topN = 5
): Promise<DashboardData> {
  const dateRangeQuery = buildQuery({ from: range.from, to: range.to });
  const dateRangeQueryWithTopN = buildQuery({
    from: range.from,
    to: range.to,
    topN,
  });
  const [summary, byMonth, byCategory, byItem] = await Promise.all([
    getJson<SummaryResponse>(`/api/v1/dashboard/summary${dateRangeQuery}`),
    getJson<ByMonthResponse>(`/api/v1/dashboard/by-month${dateRangeQuery}`),
    getJson<ByCategoryResponse>(
      `/api/v1/dashboard/by-category${dateRangeQuery}`
    ),
    getJson<ByItemResponse>(
      `/api/v1/dashboard/by-item${dateRangeQueryWithTopN}`
    ),
  ]);
  return { summary, byMonth, byCategory, byItem };
}

// ─── 마스터 ────────────────────────────────────────────────────────────────

export interface ItemOption {
  code: string;
  name: string;
  unit: string;
  categoryCode: string;
  categoryName: string;
  scope: number;
}

export function fetchItems(): Promise<ItemOption[]> {
  return getJson<ItemOption[]>("/api/v1/items");
}

// ─── 활동 ─────────────────────────────────────────────────────────────────

export interface ActivityCreatePayload {
  itemCode: string;
  occurredAt: string;
  amount: number;
  unit: string;
  memo?: string;
}

export interface ActivityCreateResponse {
  id: number;
  itemCode: string;
  occurredAt: string;
  amount: string;
  unit: string;
}

export function createActivity(
  payload: ActivityCreatePayload
): Promise<ActivityCreateResponse> {
  return postJson<ActivityCreateResponse>("/api/v1/activities", payload);
}

// ─── 배출계수 ──────────────────────────────────────────────────────────────

export interface FactorRow {
  id: number;
  itemCode: string;
  itemName: string;
  version: number;
  value: string;
  unit: string;
  validFrom: string;
  validTo: string | null;
  source: string | null;
  note: string | null;
}

export function fetchFactors(itemCode?: string): Promise<FactorRow[]> {
  const queryString = buildQuery({ itemCode });
  return getJson<FactorRow[]>(`/api/v1/emission-factors${queryString}`);
}

export interface FactorCreatePayload {
  itemCode: string;
  value: number;
  unit: string;
  validFrom: string;
  validTo?: string | null;
  source?: string;
  note?: string;
}

export function createFactor(
  payload: FactorCreatePayload
): Promise<FactorRow> {
  return postJson<FactorRow>("/api/v1/emission-factors", payload);
}

// ─── 임포트 ────────────────────────────────────────────────────────────────

export interface ImportRowError {
  rowIndex: number;
  raw: Record<string, unknown>;
  message: string;
}

export type ImportStatus = "SUCCESS" | "PARTIAL" | "FAILED";

export interface ImportRunResponse {
  batchId: string;
  filename: string;
  status: ImportStatus;
  totalRows: number;
  successCount: number;
  failedCount: number;
  sheetName: string;
  errors: ImportRowError[];
}

export interface ImportBatchSummary {
  id: string;
  filename: string;
  rowCount: number;
  successCount: number;
  failedCount: number;
  status: ImportStatus;
  createdAt: string;
}

export async function importExcel(file: File): Promise<ImportRunResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/v1/import", {
    method: "POST",
    body: formData,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new ApiError(
      payload?.error ?? {
        code: "UNKNOWN",
        message: `${response.status} ${response.statusText}`,
      },
      response.status
    );
  }
  return payload.data as ImportRunResponse;
}

export function fetchImportBatches(): Promise<ImportBatchSummary[]> {
  return getJson<ImportBatchSummary[]>("/api/v1/import");
}
