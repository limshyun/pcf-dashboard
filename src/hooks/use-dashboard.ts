"use client";

// 대시보드 데이터 fetch + 로딩/에러 상태를 캡슐화한 커스텀 훅.
// page.tsx는 이 훅의 반환만 다루므로 fetch 디테일과 분리된다.

import { useCallback, useEffect, useState } from "react";

import {
  type DashboardData,
  type DashboardRange,
  fetchDashboard,
} from "@/lib/api-client";

export interface UseDashboardResult {
  data: DashboardData | undefined;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useDashboard(
  range: DashboardRange,
  topN = 5
): UseDashboardResult {
  const [data, setData] = useState<DashboardData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchDashboard(range, topN);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }, [range, topN]);

  useEffect(() => {
    load();
  }, [load, tick]);

  return {
    data,
    loading,
    error,
    reload: useCallback(() => setTick((t) => t + 1), []),
  };
}
