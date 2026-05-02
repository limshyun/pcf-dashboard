"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { ByItemResponse } from "@/src/lib/api-client";
import { ITEM_LABEL, formatCo2e } from "@/src/lib/format";

interface Props {
  data?: ByItemResponse;
  loading: boolean;
}

export function TopItemsChart({ data, loading }: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>품목별 Top {data?.topN ?? 5}</CardTitle>
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
              <BarChart
                layout="vertical"
                data={data.buckets.map((b) => ({
                  name: ITEM_LABEL[b.itemCode] ?? b.itemCode,
                  kg: Number(b.co2eKg),
                }))}
                margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="oklch(0.9 0.005 286)"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatCo2e(v).value}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(v: number) => {
                    const f = formatCo2e(v);
                    return [`${f.value} ${f.unit}`, "배출량"];
                  }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="kg"
                  fill="oklch(0.65 0.16 160)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
