"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import type { SummaryResponse } from "@/src/lib/api-client";
import { SCOPE_LABEL, formatCo2e, formatRatio } from "@/src/lib/format";

interface Props {
  summary?: SummaryResponse;
  loading: boolean;
}

export function KpiCards({ summary, loading }: Props) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const total = formatCo2e(summary.totalCo2eKg);
  const dominant = [...summary.scopeBreakdown].sort(
    (a, b) => Number(b.co2eKg) - Number(a.co2eKg)
  )[0];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">총 배출량</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-3xl font-semibold tabular-nums">
              {total.value}
            </span>
            <span className="text-sm text-muted-foreground">{total.unit}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">활동 건수</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-3xl font-semibold tabular-nums">
              {summary.activityCount.toLocaleString("ko-KR")}
            </span>
            <span className="text-sm text-muted-foreground">건</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">계산 실패</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-heading text-3xl font-semibold tabular-nums ${
                summary.failureCount > 0 ? "text-destructive" : ""
              }`}
            >
              {summary.failureCount.toLocaleString("ko-KR")}
            </span>
            <span className="text-sm text-muted-foreground">건</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">주요 Scope</CardTitle>
        </CardHeader>
        <CardContent>
          {dominant ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {SCOPE_LABEL[dominant.scope] ?? `Scope ${dominant.scope}`}
              </Badge>
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatRatio(dominant.ratio)}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">데이터 없음</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
