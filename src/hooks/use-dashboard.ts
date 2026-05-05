"use client";

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
      const dashboardData = await fetchDashboard(range, topN);
      setData(dashboardData);
    } catch (unknownError) {
      setError(
        unknownError instanceof Error ? unknownError.message : "데이터 로드 실패"
      );
    } finally {
      setLoading(false);
    }
  }, [range, topN]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load가 로딩/에러 상태 갱신
    void load();
  }, [load, tick]);

  return {
    data,
    loading,
    error,
    reload: useCallback(() => setTick((prev) => prev + 1), []),
  };
}
