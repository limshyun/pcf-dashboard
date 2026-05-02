"use client";

import { Badge } from "@/components/ui/badge";

import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import type { SummaryResponse } from "@/lib/api-client";
import { SCOPE_LABEL, formatCo2e, formatRatio } from "@/lib/format";

interface Props {
  summary?: SummaryResponse;
  loading: boolean;
}

export function KpiCards({ summary, loading }: Props) {
  if (loading || !summary) {
    return (
      <KpiGrid>
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCard.Skeleton key={i} />
        ))}
      </KpiGrid>
    );
  }

  const total = formatCo2e(summary.totalCo2eKg);
  const dominant = [...summary.scopeBreakdown].sort(
    (a, b) => Number(b.co2eKg) - Number(a.co2eKg)
  )[0];

  return (
    <KpiGrid>
      <KpiCard label="총 배출량" value={total.value} unit={total.unit} />
      <KpiCard
        label="활동 건수"
        value={summary.activityCount.toLocaleString("ko-KR")}
        unit="건"
      />
      <KpiCard
        label="계산 실패"
        value={summary.failureCount.toLocaleString("ko-KR")}
        unit="건"
        emphasis={summary.failureCount > 0 ? "destructive" : "default"}
      />
      <KpiCard
        label="주요 Scope"
        value={
          dominant ? (
            <Badge variant="secondary" className="text-sm">
              {SCOPE_LABEL[dominant.scope] ?? `Scope ${dominant.scope}`}
            </Badge>
          ) : (
            "—"
          )
        }
        hint={dominant ? `비중 ${formatRatio(dominant.ratio)}` : "데이터 없음"}
      />
    </KpiGrid>
  );
}
