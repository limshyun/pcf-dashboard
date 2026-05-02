"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { ByMonthResponse } from "@/src/lib/api-client";
import { formatCo2e, formatYearMonthLabel } from "@/src/lib/format";

interface Props {
  data?: ByMonthResponse;
  loading: boolean;
}

export function MonthlyTrendChart({ data, loading }: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>월별 배출량 추이</CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !data ? (
          <Skeleton className="h-72 w-full" />
        ) : data.buckets.length === 0 ? (
          <Empty />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.buckets.map((b) => ({
                  label: formatYearMonthLabel(b.yearMonth),
                  kg: Number(b.co2eKg),
                }))}
                margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.9 0.005 286)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatCo2e(v).value}
                />
                <Tooltip
                  formatter={(v: number) => {
                    const f = formatCo2e(v);
                    return [`${f.value} ${f.unit}`, "배출량"];
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="oklch(0.55 0.18 250)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Empty() {
  return (
    <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
      해당 기간에 데이터가 없습니다.
    </div>
  );
}
