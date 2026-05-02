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
    // 의도적: range/tick 변경 시 fetch 트리거. load() 내부의 setLoading/setError는
    // 데이터 동기화 전 UI 상태 전환을 위해 필수적이다.
    // 정석은 SWR/React Query로 외부 store에 위임이지만, 과제 범위상 외부 의존을 피한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, tick]);

  return {
    data,
    loading,
    error,
    reload: useCallback(() => setTick((t) => t + 1), []),
  };
}
