"use client";

import { useEffect, useState } from "react";

import { type ItemOption, fetchItems } from "@/lib/api-client";

interface State {
  items: ItemOption[];
  loading: boolean;
  error: string | null;
}

export function useItems(): State {
  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    fetchItems()
      .then((items) => {
        if (alive) setState({ items, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (alive)
          setState({
            items: [],
            loading: false,
            error: e instanceof Error ? e.message : "품목 로드 실패",
          });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
