"use client";

import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";

import { ChartCard } from "@/src/components/ui/chart-card";
import type { ByCategoryResponse } from "@/src/lib/api-client";
import { CATEGORY_COLOR, CATEGORY_LABEL, formatCo2e, formatRatio } from "@/src/lib/format";

interface Props {
  data?: ByCategoryResponse;
  loading: boolean;
}

export function CategoryDonutChart({ data, loading }: Props) {
  const isEmpty = !loading && (data?.buckets.length ?? 0) === 0;
  const series = data?.buckets.map((b) => ({
    name: CATEGORY_LABEL[b.categoryCode] ?? b.categoryCode,
    code: b.categoryCode,
    value: Number(b.co2eKg),
    ratio: b.ratio,
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
              {series.map((s) => (
                <Cell
                  key={s.code}
                  fill={CATEGORY_COLOR[s.code] ?? "oklch(0.7 0 0)"}
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
        )}
      </ChartCard.Body>
    </ChartCard>
  );
}
