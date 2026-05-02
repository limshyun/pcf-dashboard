"use client";

import { useCallback, useEffect, useState } from "react";

import { type FactorRow, fetchFactors } from "@/lib/api-client";

interface State {
  rows: FactorRow[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useFactors(itemCode?: string): State {
  const [rows, setRows] = useState<FactorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchFactors(itemCode);
      setRows(list);
    } catch (unknownError) {
      setError(
        unknownError instanceof Error ? unknownError.message : "조회 실패"
      );
    } finally {
      setLoading(false);
    }
  }, [itemCode]);

  useEffect(() => {
    // use-dashboard와 동일 트레이드오프: SWR/React Query 미도입.
    // load() 내부 setLoading은 fetch 동기화 전 UI 상태 전환을 위해 필수.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, tick]);

  return {
    rows,
    loading,
    error,
    reload: useCallback(() => setTick((prev) => prev + 1), []),
  };
}
