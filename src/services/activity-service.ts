import { Prisma } from "@prisma/client";
import { z } from "zod";

import { UnitMismatchError, UnknownItemError } from "@/domain/errors";
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
});

export type ActivityListQuery = z.infer<typeof ActivityListQuerySchema>;

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

export async function listActivities(filter: ActivityListQuery = {}) {
  return prisma.activity.findMany({
    where: {
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
    },
    include: { item: { include: { category: true } } },
    orderBy: { occurredAt: "desc" },
  });
}
