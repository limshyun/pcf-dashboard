"use client";

import { useCallback, useEffect, useState } from "react";

import { CategoryDonutChart } from "@/src/components/dashboard/category-donut-chart";
import { DateRangeFilter } from "@/src/components/dashboard/date-range-filter";
import { KpiCards } from "@/src/components/dashboard/kpi-cards";
import { MonthlyTrendChart } from "@/src/components/dashboard/monthly-trend-chart";
import { TopItemsChart } from "@/src/components/dashboard/top-items-chart";
import {
  type DashboardData,
  type DashboardRange,
  fetchDashboard,
} from "@/src/lib/api-client";

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>({});
  const [data, setData] = useState<DashboardData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (r: DashboardRange) => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchDashboard(r);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            PCF Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            제품별 탄소 발자국(Product Carbon Footprint) 시각화
          </p>
        </div>
        <DateRangeFilter
          initial={range}
          onApply={(r) => setRange(r)}
          loading={loading}
        />
      </header>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <KpiCards summary={data?.summary} loading={loading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <MonthlyTrendChart data={data?.byMonth} loading={loading} />
        </div>
        <CategoryDonutChart data={data?.byCategory} loading={loading} />
        <TopItemsChart data={data?.byItem} loading={loading} />
      </div>

      {data && data.summary.failureCount > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-50/50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          ⚠ 계산 실패 {data.summary.failureCount}건이 있습니다. 단위/배출계수 데이터를 확인하세요.
        </div>
      )}
    </main>
  );
}
