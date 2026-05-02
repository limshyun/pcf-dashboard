import { Prisma } from "@prisma/client";
import { z } from "zod";

import { calculateEmission, pickFactorAt } from "@/domain/pcf-calculator";
import { UnitMismatchError, UnknownItemError } from "@/domain/errors";
import {
  toActivityInput,
  toFactorInput,
  type ActivityWithRelations,
} from "@/lib/db-mappers";
import { prisma } from "@/lib/prisma";

export const ActivityCreateSchema = z.object({
  itemCode: z.string().min(1),
  occurredAt: z.coerce.date(),
  amount: z.coerce.number().positive(),
  unit: z.string().min(1),
  memo: z.string().optional(),
});

export type ActivityCreateInput = z.infer<typeof ActivityCreateSchema>;

export const ActivityListQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  categoryCode: z.string().optional(),
  itemCode: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type ActivityListQuery = z.infer<typeof ActivityListQuerySchema>;

function buildActivityWhere(
  filter: Omit<ActivityListQuery, "limit" | "offset">
): Prisma.ActivityWhereInput {
  return {
    ...(filter.from || filter.to
      ? {
          occurredAt: {
            ...(filter.from && { gte: filter.from }),
            ...(filter.to && { lt: filter.to }),
          },
        }
      : {}),
    ...((filter.itemCode || filter.categoryCode) && {
      item: {
        ...(filter.itemCode && { code: filter.itemCode }),
        ...(filter.categoryCode && {
          category: { code: filter.categoryCode },
        }),
      },
    }),
  };
}

export async function createActivity(input: ActivityCreateInput) {
  const item = await prisma.activityItem.findUnique({
    where: { code: input.itemCode },
  });
  if (!item) {
    throw new UnknownItemError(input.itemCode);
  }
  if (item.unit !== input.unit) {
    throw new UnitMismatchError(item.code, input.unit, item.unit);
  }

  return prisma.activity.create({
    data: {
      itemId: item.id,
      occurredAt: input.occurredAt,
      amount: new Prisma.Decimal(input.amount),
      unit: input.unit,
      memo: input.memo,
    },
    include: { item: { include: { category: true } } },
  });
}

export async function countActivities(
  filter: Omit<ActivityListQuery, "limit" | "offset"> = {}
) {
  return prisma.activity.count({ where: buildActivityWhere(filter) });
}

export async function listActivities(filter: ActivityListQuery = {}) {
  const { limit, offset, ...rest } = filter;
  return prisma.activity.findMany({
    where: buildActivityWhere(rest),
    include: { item: { include: { category: true } } },
    orderBy: { occurredAt: "desc" },
    ...(limit != null ? { take: limit } : {}),
    ...(offset != null ? { skip: offset } : {}),
  });
}

export interface ActivityListRow {
  id: number;
  itemCode: string;
  itemName: string;
  categoryCode: string;
  scope: number;
  occurredAt: string;
  amount: string;
  unit: string;
  memo: string | null;
  factorValue: string | null;
  factorUnit: string | null;
  factorVersion: number | null;
  co2eKg: string | null;
  calculationError: string | null;
}

function mapActivityToListRow(a: ActivityWithRelations): Omit<
  ActivityListRow,
  | "factorValue"
  | "factorUnit"
  | "factorVersion"
  | "co2eKg"
  | "calculationError"
> {
  return {
    id: a.id,
    itemCode: a.item.code,
    itemName: a.item.name,
    categoryCode: a.item.category.code,
    scope: a.item.category.scope,
    occurredAt: a.occurredAt.toISOString().slice(0, 10),
    amount: a.amount.toString(),
    unit: a.unit,
    memo: a.memo,
  };
}

/** 활동 목록 + 건별 배출 계산(표시용). factors는 전역 로드. */
export async function listActivitiesWithEmissions(
  filter: ActivityListQuery
): Promise<{ rows: ActivityListRow[]; total: number }> {
  const { limit, offset, ...rest } = filter;
  const take = limit ?? 50;
  const skip = offset ?? 0;
  const where = buildActivityWhere(rest);

  const [total, activities, factorRecords] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      include: { item: { include: { category: true } } },
      orderBy: { occurredAt: "desc" },
      take,
      skip,
    }),
    prisma.emissionFactor.findMany({ include: { item: true } }),
  ]);

  const factors = factorRecords.map(toFactorInput);

  const rows: ActivityListRow[] = activities.map((a) => {
    const base = mapActivityToListRow(a as ActivityWithRelations);
    const input = toActivityInput(a as ActivityWithRelations);
    try {
      const res = calculateEmission(input, factors);
      const factor = pickFactorAt(factors, input.item.code, input.occurredAt);
      return {
        ...base,
        factorValue: factor ? String(factor.value) : null,
        factorUnit: factor?.unit ?? null,
        factorVersion: res.factorVersion,
        co2eKg: res.co2eKg.toString(),
        calculationError: null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ...base,
        factorValue: null,
        factorUnit: null,
        factorVersion: null,
        co2eKg: null,
        calculationError: message,
      };
    }
  });

  return { rows, total };
}

export async function deleteActivityById(id: number) {
  const result = await prisma.activity.deleteMany({ where: { id } });
  return result.count > 0;
}
