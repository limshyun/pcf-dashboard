"use client";

import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";

import { ChartCard } from "@/components/ui/chart-card";
import type { ByCategoryResponse } from "@/lib/api-client";
import { CATEGORY_COLOR, CATEGORY_LABEL, formatCo2e, formatRatio } from "@/lib/format";

interface Props {
  data?: ByCategoryResponse;
  loading: boolean;
}

export function CategoryDonutChart({ data, loading }: Props) {
  const isEmpty = !loading && (data?.buckets.length ?? 0) === 0;
  const series =
    data?.buckets.map((bucket) => ({
      name: CATEGORY_LABEL[bucket.categoryCode] ?? bucket.categoryCode,
      code: bucket.categoryCode,
      value: Number(bucket.co2eKg),
      ratio: bucket.ratio,
    })) ?? [];

  return (
    <ChartCard>
      <ChartCard.Header>
        <ChartCard.Title>카테고리별 비중</ChartCard.Title>
      </ChartCard.Header>
      <ChartCard.Body loading={loading} isEmpty={isEmpty}>
        {({ width, height }) => (
          <PieChart width={width} height={height}>
            <Pie
              data={series}
              dataKey="value"
              nameKey="name"
              innerRadius={Math.min(width, height) * 0.22}
              outerRadius={Math.min(width, height) * 0.36}
              paddingAngle={2}
              stroke="var(--background)"
            >
              {series.map((segment) => (
                <Cell
                  key={segment.code}
                  fill={CATEGORY_COLOR[segment.code] ?? "oklch(0.7 0 0)"}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(rawKg, _name, item) => {
                const formatted = formatCo2e(
                  typeof rawKg === "number" ? rawKg : Number(rawKg ?? 0)
                );
                const ratio =
                  (item?.payload as { ratio?: number })?.ratio ?? 0;
                return [
                  `${formatted.value} ${formatted.unit} (${formatRatio(ratio)})`,
                  "배출량",
                ];
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
        )}
      </ChartCard.Body>
    </ChartCard>
  );
}
