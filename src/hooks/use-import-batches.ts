"use client";

import { useCallback, useEffect, useState } from "react";

import { type ImportBatchSummary, fetchImportBatches } from "@/lib/api-client";

interface State {
  batches: ImportBatchSummary[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useImportBatches(): State {
  const [batches, setBatches] = useState<ImportBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchImportBatches();
      setBatches(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "히스토리 로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // use-dashboard와 동일 trade-off: SWR/React Query 미도입.
    // load() 내부 setLoading은 fetch 동기화 전 UI 상태 전환을 위해 필수.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, tick]);

  return {
    batches,
    loading,
    error,
    reload: useCallback(() => setTick((t) => t + 1), []),
  };
}
