"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/ui/chart-card";
import type { ByItemResponse } from "@/lib/api-client";
import { ITEM_LABEL, formatCo2e } from "@/lib/format";

interface Props {
  data?: ByItemResponse;
  loading: boolean;
}

export function TopItemsChart({ data, loading }: Props) {
  const isEmpty = !loading && (data?.buckets.length ?? 0) === 0;
  const series = data?.buckets.map((b) => ({
    name: ITEM_LABEL[b.itemCode] ?? b.itemCode,
    kg: Number(b.co2eKg),
  })) ?? [];

  return (
    <ChartCard>
      <ChartCard.Header>
        <ChartCard.Title>품목별 Top {data?.topN ?? 5}</ChartCard.Title>
      </ChartCard.Header>
      <ChartCard.Body loading={loading} isEmpty={isEmpty}>
        {({ width, height }) => (
          <BarChart
            width={width}
            height={height}
            layout="vertical"
            data={series}
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
        )}
      </ChartCard.Body>
    </ChartCard>
  );
}
