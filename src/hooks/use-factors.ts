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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load가 로딩/에러 상태 갱신
    void load();
  }, [load, tick]);

  return {
    rows,
    loading,
    error,
    reload: useCallback(() => setTick((prev) => prev + 1), []),
  };
}
