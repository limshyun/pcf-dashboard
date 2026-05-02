"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { ByCategoryResponse } from "@/src/lib/api-client";
import { CATEGORY_COLOR, CATEGORY_LABEL, formatCo2e, formatRatio } from "@/src/lib/format";

interface Props {
  data?: ByCategoryResponse;
  loading: boolean;
}

export function CategoryDonutChart({ data, loading }: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>카테고리별 비중</CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !data ? (
          <Skeleton className="h-72 w-full" />
        ) : data.buckets.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            해당 기간에 데이터가 없습니다.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.buckets.map((b) => ({
                    name: CATEGORY_LABEL[b.categoryCode] ?? b.categoryCode,
                    code: b.categoryCode,
                    value: Number(b.co2eKg),
                    ratio: b.ratio,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="var(--background)"
                >
                  {data.buckets.map((b) => (
                    <Cell
                      key={b.categoryCode}
                      fill={CATEGORY_COLOR[b.categoryCode] ?? "oklch(0.7 0 0)"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, _n: string, item) => {
                    const f = formatCo2e(v);
                    const ratio = (item?.payload as { ratio?: number })?.ratio ?? 0;
                    return [`${f.value} ${f.unit} (${formatRatio(ratio)})`, "배출량"];
                  }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
