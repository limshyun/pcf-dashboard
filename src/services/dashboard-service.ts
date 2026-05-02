// 활동/계수 로드 → 도메인 입력 매핑 → 도메인 계산 → 응답 변환.
// 4개 dashboard 라우트가 공유한다.

import { z } from "zod";

import {
  aggregateByCategory,
  aggregateByItem,
  aggregateByMonth,
  aggregateByScope,
  totalEmission,
} from "@/domain/pcf-aggregator";
import { calculateEmissions } from "@/domain/pcf-calculator";
import { toActivityInput, toFactorInput } from "@/lib/db-mappers";
import { prisma } from "@/lib/prisma";
import {
  listActivitiesWithEmissions,
  type ActivityListRow,
} from "@/services/activity-service";

export const DashboardRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type DashboardRange = z.infer<typeof DashboardRangeSchema>;

async function computeAll(range: DashboardRange) {
  const [activities, factors] = await Promise.all([
    prisma.activity.findMany({
      where: {
        ...(range.from || range.to
          ? {
              occurredAt: {
                ...(range.from && { gte: range.from }),
                ...(range.to && { lt: range.to }),
              },
            }
          : {}),
      },
      include: { item: { include: { category: true } } },
    }),
    prisma.emissionFactor.findMany({ include: { item: true } }),
  ]);

  return calculateEmissions(
    activities.map(toActivityInput),
    factors.map(toFactorInput)
  );
}

function rangeMeta(range: DashboardRange) {
  return {
    rangeFrom: range.from?.toISOString().slice(0, 10) ?? null,
    rangeTo: range.to?.toISOString().slice(0, 10) ?? null,
  };
}

export async function getSummary(range: DashboardRange) {
  const { results, failures } = await computeAll(range);
  const total = totalEmission(results);
  const byScope = aggregateByScope(results);

  return {
    ...rangeMeta(range),
    totalCo2eKg: total.toString(),
    activityCount: results.length,
    failureCount: failures.length,
    scopeBreakdown: byScope.map((bucket) => ({
      scope: bucket.scope,
      co2eKg: bucket.co2eKg.toString(),
      ratio: Number(bucket.ratio.toFixed(6)),
    })),
  };
}

export async function getByMonth(range: DashboardRange) {
  const { results } = await computeAll(range);
  return {
    ...rangeMeta(range),
    buckets: aggregateByMonth(results).map((bucket) => ({
      yearMonth: bucket.yearMonth,
      co2eKg: bucket.co2eKg.toString(),
    })),
  };
}

export async function getByCategory(range: DashboardRange) {
  const { results } = await computeAll(range);
  return {
    ...rangeMeta(range),
    buckets: aggregateByCategory(results).map((bucket) => ({
      categoryCode: bucket.categoryCode,
      co2eKg: bucket.co2eKg.toString(),
      ratio: Number(bucket.ratio.toFixed(6)),
    })),
  };
}

export const ByItemQuerySchema = DashboardRangeSchema.extend({
  topN: z.coerce.number().int().positive().optional(),
});

export type ByItemQuery = z.infer<typeof ByItemQuerySchema>;

export async function getByItem(range: ByItemQuery) {
  const { results } = await computeAll(range);
  return {
    ...rangeMeta(range),
    topN: range.topN ?? null,
    buckets: aggregateByItem(results, range.topN).map((bucket) => ({
      itemCode: bucket.itemCode,
      co2eKg: bucket.co2eKg.toString(),
    })),
  };
}

export const ActivityLinesQuerySchema = DashboardRangeSchema.extend({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type ActivityLinesQuery = z.infer<typeof ActivityLinesQuerySchema>;

/** 대시보드 기간과 동일 필터로 활동 원장 + 건별 PCF(표시용). */
export async function getActivityLines(
  query: ActivityLinesQuery
): Promise<{
  rows: ActivityListRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const { rows, total } = await listActivitiesWithEmissions({
    from: query.from,
    to: query.to,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  return { rows, total, page, pageSize };
}
