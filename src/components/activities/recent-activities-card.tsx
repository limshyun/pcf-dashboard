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
  ApiError,
  type ActivityRow,
  deleteActivity,
  fetchActivities,
} from "@/lib/api-client";
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  formatCo2e,
  SCOPE_LABEL,
} from "@/lib/format";

interface Props {
  /** 저장 성공 시 증가시켜 목록을 다시 불러옵니다. */
  reloadKey: number;
}

export function RecentActivitiesCard({ reloadKey }: Props) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rows: next } = await fetchActivities({
        limit: 20,
        offset: 0,
        includeEmissions: true,
      });
      setRows(next);
    } catch (unknownError) {
      setError(
        unknownError instanceof Error ? unknownError.message : "목록 로드 실패"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [reloadKey, load]);

  const onDelete = async (id: number) => {
    if (!window.confirm("이 활동 기록을 삭제할까요?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteActivity(id);
      await load();
    } catch (unknownError) {
      const msg =
        unknownError instanceof ApiError
          ? unknownError.message
          : unknownError instanceof Error
            ? unknownError.message
            : "삭제 실패";
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>최근 활동</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            최근 20건 · 발생일 기준 배출계수로 계산한 PCF입니다.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          새로고침
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            아직 등록된 활동이 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>항목</TableHead>
                  <TableHead className="text-right">활동량</TableHead>
                  <TableHead className="text-right">PCF</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
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
                      <TableCell className="max-w-[120px] truncate text-sm">
                        {row.itemName}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {row.amount} {row.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-emerald-700 dark:text-emerald-400">
                        {row.calculationError ? (
                          <span
                            className="text-destructive"
                            title={row.calculationError}
                          >
                            실패
                          </span>
                        ) : (
                          `${pcf.value} ${pcf.unit}`
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={deletingId === row.id}
                          onClick={() => void onDelete(row.id)}
                        >
                          {deletingId === row.id ? "…" : "삭제"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
