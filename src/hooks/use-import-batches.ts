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
    } catch (unknownError) {
      setError(
        unknownError instanceof Error ? unknownError.message : "히스토리 로드 실패"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load가 로딩/에러 상태 갱신
    void load();
  }, [load, tick]);

  return {
    batches,
    loading,
    error,
    reload: useCallback(() => setTick((prev) => prev + 1), []),
  };
}
