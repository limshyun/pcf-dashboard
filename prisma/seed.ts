/**
 * 시드 스크립트.
 *
 * 1. 마스터 데이터 upsert: 카테고리, 품목, 배출계수(version=1)
 * 2. prisma/seed-data/activity-data.xlsx 가 있으면 파서로 활동 데이터 로드
 *    - 같은 파서를 임포트 API에서도 재사용한다 (Step 8)
 *
 * 실행: yarn db:seed
 */

import { PrismaClient, ImportStatus, Prisma } from "@prisma/client";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import {
  parseActivitiesExcel,
  MASTER_DATA,
  INITIAL_EMISSION_FACTORS,
} from "../src/lib/excel-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEL_PATH = path.resolve(__dirname, "seed-data/activity-data.xlsx");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 PCF Dashboard 시드 시작\n");

  // 1) 카테고리
  console.log("[1/4] 카테고리 upsert");
  for (const c of MASTER_DATA.categories) {
    await prisma.activityCategory.upsert({
      where: { code: c.code },
      update: { name: c.name, scope: c.scope },
      create: { code: c.code, name: c.name, scope: c.scope },
    });
    console.log(`      ✓ ${c.code} (${c.name}, Scope ${c.scope})`);
  }

  // 2) 품목
  console.log("\n[2/4] 품목 upsert");
  for (const i of MASTER_DATA.items) {
    const cat = await prisma.activityCategory.findUniqueOrThrow({
      where: { code: i.categoryCode },
    });
    await prisma.activityItem.upsert({
      where: { code: i.code },
      update: { name: i.name, unit: i.unit, categoryId: cat.id },
      create: { code: i.code, name: i.name, unit: i.unit, categoryId: cat.id },
    });
    console.log(`      ✓ ${i.code} (${i.name}, ${i.unit})`);
  }

  // 3) 배출계수 (version=1)
  console.log("\n[3/4] 배출계수 upsert (version=1)");
  for (const f of INITIAL_EMISSION_FACTORS) {
    const item = await prisma.activityItem.findUniqueOrThrow({
      where: { code: f.itemCode },
    });
    await prisma.emissionFactor.upsert({
      where: { itemId_version: { itemId: item.id, version: 1 } },
      update: {
        value: new Prisma.Decimal(f.value),
        unit: f.unit,
        source: f.source,
        validFrom: f.validFrom,
      },
      create: {
        itemId: item.id,
        version: 1,
        value: new Prisma.Decimal(f.value),
        unit: f.unit,
        source: f.source,
        validFrom: f.validFrom,
      },
    });
    console.log(`      ✓ ${f.itemCode} = ${f.value} ${f.unit}`);
  }

  // 4) 활동 데이터 (Excel)
  console.log("\n[4/4] 활동 데이터 (Excel)");
  if (!fs.existsSync(EXCEL_PATH)) {
    console.log(`      ⚠ Excel 파일이 없어 건너뜁니다.`);
    console.log(`        ${EXCEL_PATH}`);
    console.log(
      `        구글 시트에서 .xlsx로 다운로드 후 위 경로에 두고 다시 실행하세요.`
    );
    console.log("\n✅ 마스터 데이터 시드 완료");
    return;
  }

  console.log(`      파일: ${path.basename(EXCEL_PATH)}`);
  const result = parseActivitiesExcel(EXCEL_PATH);
  console.log(
    `      파싱 결과: 총 ${result.totalRows}행, 성공 ${result.rows.length}, 실패 ${result.errors.length}`
  );
  if (result.errors.length > 0) {
    console.log(`      실패 샘플(최대 5건):`);
    result.errors.slice(0, 5).forEach((e) => {
      console.log(`        [행 ${e.rowIndex}] ${e.message}`);
    });
  }

  // 4-a) 임포트 배치 기록
  const status: ImportStatus =
    result.errors.length === 0
      ? ImportStatus.SUCCESS
      : result.rows.length === 0
        ? ImportStatus.FAILED
        : ImportStatus.PARTIAL;

  const batch = await prisma.importBatch.create({
    data: {
      filename: `[SEED] ${path.basename(EXCEL_PATH)}`,
      rowCount: result.totalRows,
      successCount: result.rows.length,
      failedCount: result.errors.length,
      status,
      errors: result.errors.length > 0 ? (result.errors as unknown as Prisma.InputJsonValue) : undefined,
    },
  });

  // 4-b) Activity 일괄 insert
  if (result.rows.length > 0) {
    const items = await prisma.activityItem.findMany();
    const itemIdByCode = new Map(items.map((i) => [i.code, i.id]));

    await prisma.activity.createMany({
      data: result.rows.map((r) => ({
        itemId: itemIdByCode.get(r.itemCode)!,
        occurredAt: r.occurredAt,
        amount: new Prisma.Decimal(r.amount),
        unit: r.unit,
        importBatchId: batch.id,
      })),
    });

    console.log(`      ✓ ${result.rows.length}건 insert (batch ${batch.id})`);
  }

  console.log("\n✅ 시드 완료");
}

main()
  .catch((e) => {
    console.error("\n❌ 시드 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
