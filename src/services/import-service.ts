// trade-off: ImportBatch 생성과 Activity insert를 한 트랜잭션으로 묶어 부분 성공도 원자적으로 기록한다.
// 시드(prisma/seed.ts)와 같은 파서를 공유하여 입력 데이터 형식의 단일 소스 오브 트루스를 유지한다.

import { ImportStatus, Prisma } from "@prisma/client";

import {
  type ParseResult,
  parseActivitiesExcel,
} from "@/lib/excel-parser";
import { prisma } from "@/lib/prisma";

export interface ImportRunResult {
  batchId: string;
  filename: string;
  status: ImportStatus;
  totalRows: number;
  successCount: number;
  failedCount: number;
  sheetName: string;
  errors: ParseResult["errors"];
}

function decideStatus(parsed: ParseResult): ImportStatus {
  if (parsed.errors.length === 0) return ImportStatus.SUCCESS;
  if (parsed.rows.length === 0) return ImportStatus.FAILED;
  return ImportStatus.PARTIAL;
}

export async function runImport(
  filename: string,
  buffer: Buffer | ArrayBuffer
): Promise<ImportRunResult> {
  const parsed = parseActivitiesExcel(buffer);
  const status = decideStatus(parsed);

  const items = await prisma.activityItem.findMany();
  const itemIdByCode = new Map(
    items.map((item) => [item.code, item.id])
  );

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.importBatch.create({
      data: {
        filename,
        rowCount: parsed.totalRows,
        successCount: parsed.rows.length,
        failedCount: parsed.errors.length,
        status,
        errors:
          parsed.errors.length > 0
            ? (parsed.errors as unknown as Prisma.InputJsonValue)
            : undefined,
      },
    });

    if (parsed.rows.length > 0) {
      await tx.activity.createMany({
        data: parsed.rows
          .map((parsedRow) => {
            const itemId = itemIdByCode.get(parsedRow.itemCode);
            if (!itemId) return null;
            return {
              itemId,
              occurredAt: parsedRow.occurredAt,
              amount: new Prisma.Decimal(parsedRow.amount),
              unit: parsedRow.unit,
              importBatchId: created.id,
            };
          })
          .filter(
            (row): row is NonNullable<typeof row> => row !== null
          ),
      });
    }

    return created;
  });

  return {
    batchId: batch.id,
    filename,
    status,
    totalRows: parsed.totalRows,
    successCount: parsed.rows.length,
    failedCount: parsed.errors.length,
    sheetName: parsed.sheetName,
    errors: parsed.errors,
  };
}

export async function listImportBatches(limit = 20) {
  return prisma.importBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getImportBatch(id: string) {
  return prisma.importBatch.findUnique({ where: { id } });
}
