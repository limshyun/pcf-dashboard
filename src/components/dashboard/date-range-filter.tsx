"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { DashboardRange } from "@/lib/api-client";

interface Props {
  initial: DashboardRange;
  onApply: (range: DashboardRange) => void;
  loading?: boolean;
}

export function DateRangeFilter({ initial, onApply, loading }: Props) {
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onApply({ from: from || undefined, to: to || undefined });
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="filter-from">
          시작일
        </label>
        <Input
          id="filter-from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="filter-to">
          종료일 (미포함)
        </label>
        <Input
          id="filter-to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-40"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "조회 중..." : "적용"}
      </Button>
      {(from || to) && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setFrom("");
            setTo("");
            onApply({});
          }}
          disabled={loading}
        >
          초기화
        </Button>
      )}
    </form>
  );
}
