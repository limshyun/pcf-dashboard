"use client";

import { useEffect, useMemo, useState } from "react";

import { FactorCreateDialog } from "@/components/factors/factor-create-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFactors } from "@/hooks/use-factors";
import { useItems } from "@/hooks/use-items";
import {
  type FactorRecentRow,
  fetchRecentFactorVersions,
} from "@/lib/api-client";
import { CATEGORY_LABEL } from "@/lib/format";

const ALL = "__ALL__";

export default function FactorsPage() {
  const { items, loading: itemsLoading } = useItems();
  const [itemCode, setItemCode] = useState<string>(ALL);
  const { rows, loading, error, reload } = useFactors(
    itemCode === ALL ? undefined : itemCode
  );

  const itemMap = useMemo(() => {
    return new Map(items.map((item) => [item.code, item]));
  }, [items]);

  const [recentFactors, setRecentFactors] = useState<FactorRecentRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRecentLoading(true);
      setRecentError(null);
      try {
        const list = await fetchRecentFactorVersions(15);
        if (!cancelled) setRecentFactors(list);
      } catch (e) {
        if (!cancelled) {
          setRecentError(e instanceof Error ? e.message : "이력 로드 실패");
        }
      } finally {
        if (!cancelled) setRecentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rows.length]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            배출계수 버전 관리
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            품목별 배출계수의 시계열 버전을 관리합니다. 활동 일자에 맞는 버전이
            자동 매칭됩니다.
          </p>
        </div>
        <FactorCreateDialog
          defaultItemCode={itemCode === ALL ? undefined : itemCode}
          onCreated={() => reload()}
        />
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>버전 목록</CardTitle>
          <div className="w-56">
            <FormField label="품목 필터">
              <Select
                value={itemCode}
                onValueChange={(raw: string | null) =>
                  setItemCode(raw ?? ALL)
                }
              >
                <SelectTrigger className="w-full" disabled={itemsLoading}>
                  <SelectValue placeholder="전체">
                    {(selectedCode: string | null) =>
                      !selectedCode || selectedCode === ALL
                        ? "전체"
                        : (items.find((item) => item.code === selectedCode)
                            ?.name ?? selectedCode)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>전체</SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
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
            <p className="py-8 text-center text-sm text-muted-foreground">
              등록된 배출계수가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>품목</TableHead>
                  <TableHead className="w-16">버전</TableHead>
                  <TableHead className="text-right">값</TableHead>
                  <TableHead>단위</TableHead>
                  <TableHead>유효 시작</TableHead>
                  <TableHead>유효 종료</TableHead>
                  <TableHead>출처 / 비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const item = itemMap.get(row.itemCode);
                  const isActive = row.validTo === null;
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.itemName}</span>
                          <span className="text-xs text-muted-foreground">
                            {item?.categoryName ?? row.itemCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>v{row.version}</span>
                          {isActive && (
                            <Badge variant="secondary" className="text-[10px]">
                              현재
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {row.value}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.unit}
                      </TableCell>
                      <TableCell>{row.validFrom}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.validTo ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[280px] whitespace-normal text-xs text-muted-foreground">
                        {row.source && <div>{row.source}</div>}
                        {row.note && <div>{row.note}</div>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 버전 변경</CardTitle>
          <p className="text-sm text-muted-foreground">
            DB에 기록된 배출계수 행 중, 최근에 생성되거나 수정된 순입니다. 별도
            감사 로그 테이블 없이 버전 행 자체가 이력입니다.
          </p>
        </CardHeader>
        <CardContent>
          {recentError && (
            <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {recentError}
            </div>
          )}
          {recentLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : recentFactors.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              표시할 이력이 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>일시 (UTC)</TableHead>
                    <TableHead>항목</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead className="text-right">계수</TableHead>
                    <TableHead>단위</TableHead>
                    <TableHead>유효기간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFactors.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {new Date(row.updatedAt).toLocaleString("ko-KR")}
                      </TableCell>
                      <TableCell className="text-sm">{row.itemName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {CATEGORY_LABEL[row.categoryCode] ??
                            row.categoryCode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        v{row.version} · {row.value}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.unit}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {row.validFrom} ~ {row.validTo ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
