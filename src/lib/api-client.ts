// 대시보드 fetch 유틸. 모든 응답은 { data, meta? } 또는 { error } 구조 (api-response.ts와 일치).

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
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message ?? `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return json.data as T;
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
  const q = buildQuery({ from: range.from, to: range.to });
  const qWithTop = buildQuery({ from: range.from, to: range.to, topN });
  const [summary, byMonth, byCategory, byItem] = await Promise.all([
    getJson<SummaryResponse>(`/api/v1/dashboard/summary${q}`),
    getJson<ByMonthResponse>(`/api/v1/dashboard/by-month${q}`),
    getJson<ByCategoryResponse>(`/api/v1/dashboard/by-category${q}`),
    getJson<ByItemResponse>(`/api/v1/dashboard/by-item${qWithTop}`),
  ]);
  return { summary, byMonth, byCategory, byItem };
}
