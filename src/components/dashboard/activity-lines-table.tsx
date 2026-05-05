"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ActivityRow,
  type DashboardRange,
  fetchDashboardActivityLines,
} from "@/lib/api-client";
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  formatCo2e,
  SCOPE_LABEL,
} from "@/lib/format";

interface Props {
  range: DashboardRange;
}

export function ActivityLinesTable({ range }: Props) {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<{
    rows: ActivityRow[];
    total: number;
    page: number;
    pageSize: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboardActivityLines(range, page, pageSize);
      setPayload(res);
    } catch (unknownError) {
      setError(
        unknownError instanceof Error ? unknownError.message : "로드 실패"
      );
    } finally {
      setLoading(false);
    }
  }, [range, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load가 로딩/에러 상태 갱신
    void load();
  }, [load]);

  const totalPages = payload
    ? Math.max(1, Math.ceil(payload.total / pageSize))
    : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>활동 원장 · PCF</CardTitle>
        <p className="text-sm text-muted-foreground">
          선택한 기간의 활동별 배출계수 적용 결과입니다. 페이지당 {pageSize}
          건입니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>항목</TableHead>
                  <TableHead className="text-right">활동량</TableHead>
                  <TableHead className="text-right">계수</TableHead>
                  <TableHead className="text-right">PCF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payload?.rows ?? []).map((row) => {
                  const catColor =
                    CATEGORY_COLOR[row.categoryCode] ?? "oklch(0.7 0 0)";
                  const pcf =
                    row.co2eKg != null
                      ? formatCo2e(row.co2eKg)
                      : { value: "—", unit: "" };
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {row.occurredAt}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                          style={{ backgroundColor: `${catColor}33` }}
                        >
                          {CATEGORY_LABEL[row.categoryCode] ??
                            row.categoryCode}
                        </Badge>
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          {SCOPE_LABEL[row.scope] ?? `S${row.scope}`}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm">
                        {row.itemName}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {row.amount} {row.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {row.calculationError ? (
                          <span className="text-destructive">오류</span>
                        ) : (
                          <>
                            {row.factorValue} ({row.factorUnit})
                            <span className="ml-1 text-muted-foreground">
                              v{row.factorVersion}
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-emerald-700 dark:text-emerald-400">
                        {row.calculationError ? (
                          <span className="text-destructive" title={row.calculationError}>
                            실패
                          </span>
                        ) : (
                          `${pcf.value} ${pcf.unit}`
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {payload && payload.total === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            해당 기간에 등록된 활동이 없습니다.
          </p>
        )}

        {payload != null && payload.total > 0 && !loading && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              총 {payload.total.toLocaleString("ko-KR")}건 ·{" "}
              {payload.page}/{totalPages} 페이지
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                이전
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
