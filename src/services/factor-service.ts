// trade-off: 새 버전 추가 시 이전 버전의 validTo를 자동으로 닫지 않는다.
// 동일 시점 다중 버전 공존(시뮬레이션 등)을 허용하기 위해 명시적 입력을 요구한다.

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { UnknownItemError } from "@/domain/errors";
import { prisma } from "@/lib/prisma";

export const FactorListQuerySchema = z.object({
  itemCode: z.string().optional(),
});

export const FactorCreateSchema = z.object({
  itemCode: z.string().min(1),
  value: z.coerce.number().positive(),
  unit: z
    .string()
    .regex(
      /^[^/\s]+\s*\/\s*[^/\s]+$/,
      "단위는 \"<배출량 단위>/<활동량 단위>\" 형식이어야 합니다 (예: kgCO2e/kWh)"
    ),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date().nullable().optional(),
  source: z.string().optional(),
  note: z.string().optional(),
});

export type FactorCreateInput = z.infer<typeof FactorCreateSchema>;

export async function listFactors(itemCode?: string) {
  return prisma.emissionFactor.findMany({
    where: itemCode ? { item: { code: itemCode } } : undefined,
    include: { item: true },
    orderBy: [{ itemId: "asc" }, { version: "desc" }],
  });
}

/** 최근 생성·수정된 배출계수 버전(감사 UI용). */
export async function listRecentFactorVersions(limit = 20) {
  return prisma.emissionFactor.findMany({
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: { item: { include: { category: true } } },
  });
}

export async function createFactorVersion(input: FactorCreateInput) {
  const item = await prisma.activityItem.findUnique({
    where: { code: input.itemCode },
  });
  if (!item) {
    throw new UnknownItemError(input.itemCode);
  }

  const latest = await prisma.emissionFactor.findFirst({
    where: { itemId: item.id },
    orderBy: { version: "desc" },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  return prisma.emissionFactor.create({
    data: {
      itemId: item.id,
      version: nextVersion,
      value: new Prisma.Decimal(input.value),
      unit: input.unit,
      validFrom: input.validFrom,
      validTo: input.validTo ?? null,
      source: input.source,
      note: input.note,
    },
    include: { item: true },
  });
}
