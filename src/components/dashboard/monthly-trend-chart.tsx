"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/src/components/ui/chart-card";
import type { ByMonthResponse } from "@/src/lib/api-client";
import { formatCo2e, formatYearMonthLabel } from "@/src/lib/format";

interface Props {
  data?: ByMonthResponse;
  loading: boolean;
}

export function MonthlyTrendChart({ data, loading }: Props) {
  const isEmpty = !loading && (data?.buckets.length ?? 0) === 0;
  const series = data?.buckets.map((b) => ({
    label: formatYearMonthLabel(b.yearMonth),
    kg: Number(b.co2eKg),
  })) ?? [];

  return (
    <ChartCard>
      <ChartCard.Header>
        <ChartCard.Title>월별 배출량 추이</ChartCard.Title>
      </ChartCard.Header>
      <ChartCard.Body loading={loading} isEmpty={isEmpty}>
        {({ width, height }) => (
          <LineChart
            width={width}
            height={height}
            data={series}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.005 286)" />
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
        )}
      </ChartCard.Body>
    </ChartCard>
  );
}
