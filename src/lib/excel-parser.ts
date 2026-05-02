/**
 * 과제용 Excel 활동 데이터 파서.
 *
 * - 시드(prisma/seed.ts)와 임포트 API(/api/v1/imports/excel) 양쪽에서 재사용한다.
 * - 한국어 컬럼 헤더와 한국어 라벨을 그대로 받아 내부 코드(KEPCO 등)로 매핑한다.
 * - DB에 직접 접근하지 않는다(파일 → ParsedRow[]만 책임).
 */

import * as XLSX from "xlsx";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// 매핑 메타: 시트의 한국어 라벨 ↔ 내부 코드
// ─────────────────────────────────────────────────────────────────────────────

/** 시트의 헤더 컬럼명 (과제 제공 그대로) */
export const COLUMN = {
  date: "일자(원본)",
  category: "활동 유형",
  itemName: "설명",
  amount: "양",
  unit: "단위",
} as const;

/** 활동 카테고리 매핑: 한국어 라벨 → 내부 코드 + GHG Scope */
export const CATEGORY_MAP = {
  전기: { code: "ELECTRICITY", scope: 2 },
  원소재: { code: "MATERIAL", scope: 3 },
  운송: { code: "TRANSPORT", scope: 3 },
} as const;

/** 품목 매핑: 한국어 라벨 → 내부 코드 + 단위 */
export const ITEM_MAP = {
  한국전력: { code: "KEPCO", categoryCode: "ELECTRICITY", unit: "kWh" },
  "플라스틱 1": { code: "PLASTIC_1", categoryCode: "MATERIAL", unit: "kg" },
  "플라스틱 2": { code: "PLASTIC_2", categoryCode: "MATERIAL", unit: "kg" },
  트럭: { code: "TRUCK", categoryCode: "TRANSPORT", unit: "ton-km" },
} as const;

/** 시드/임포트가 공유하는 마스터 데이터 (카테고리 + 품목) */
export const MASTER_DATA = {
  categories: Object.entries(CATEGORY_MAP).map(([name, m]) => ({
    name,
    code: m.code,
    scope: m.scope,
  })),
  items: Object.entries(ITEM_MAP).map(([name, m]) => ({
    name,
    code: m.code,
    categoryCode: m.categoryCode,
    unit: m.unit,
  })),
};

/** 초기 배출계수 (version=1, validFrom=2025-01-01) */
export const INITIAL_EMISSION_FACTORS = [
  {
    itemCode: "KEPCO",
    value: 0.456,
    unit: "kgCO2e/kWh",
    source: "한국전력 기본값 (과제 제공)",
    validFrom: new Date("2025-01-01"),
  },
  {
    itemCode: "PLASTIC_1",
    value: 2.3,
    unit: "kgCO2e/kg",
    source: "과제 제공",
    validFrom: new Date("2025-01-01"),
  },
  {
    itemCode: "PLASTIC_2",
    value: 3.2,
    unit: "kgCO2e/kg",
    source: "과제 제공",
    validFrom: new Date("2025-01-01"),
  },
  {
    itemCode: "TRUCK",
    value: 3.5,
    unit: "kgCO2e/ton-km",
    source: "과제 제공",
    validFrom: new Date("2025-01-01"),
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 파싱 결과 타입
// ─────────────────────────────────────────────────────────────────────────────

const RowSchema = z.object({
  occurredAt: z.coerce.date(),
  categoryCode: z.string(),
  itemCode: z.string(),
  amount: z.coerce.number().positive(),
  unit: z.string(),
});

export type ParsedActivityRow = z.infer<typeof RowSchema>;

export interface ParsedRowError {
  rowIndex: number; // 시트의 데이터 행 번호 (1부터)
  raw: Record<string, unknown>;
  message: string;
}

export interface ParseResult {
  rows: ParsedActivityRow[];
  errors: ParsedRowError[];
  totalRows: number;
  sheetName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 파서 본체
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 활동 데이터 Excel을 파싱한다.
 * @param input 파일 경로(string) 또는 메모리 버퍼
 */
export function parseActivitiesExcel(
  input: string | Buffer | ArrayBuffer
): ParseResult {
  const wb =
    typeof input === "string"
      ? XLSX.readFile(input)
      : XLSX.read(input, { type: "buffer" });

  const sheetName = pickActivitySheet(wb);
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`활동 데이터 시트를 찾을 수 없습니다: ${sheetName}`);
  }

  const headerRow = detectHeaderRow(sheet);
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
    range: headerRow,
  });

  const rows: ParsedActivityRow[] = [];
  const errors: ParsedRowError[] = [];

  json.forEach((raw, idx) => {
    const rowIndex = idx + 1;
    try {
      const dateRaw = raw[COLUMN.date];
      const categoryRaw = raw[COLUMN.category];
      const itemRaw = raw[COLUMN.itemName];
      const amountRaw = raw[COLUMN.amount];
      const unitRaw = raw[COLUMN.unit];

      // 빈 행 무시
      if (!dateRaw && !categoryRaw && !itemRaw && !amountRaw) return;

      const categoryKey = String(categoryRaw ?? "").trim();
      const cat = (CATEGORY_MAP as Record<string, { code: string }>)[categoryKey];
      if (!cat) {
        throw new Error(`알 수 없는 활동 유형: "${categoryKey}"`);
      }

      const itemKey = String(itemRaw ?? "").trim();
      const item = (ITEM_MAP as Record<
        string,
        { code: string; categoryCode: string; unit: string }
      >)[itemKey];
      if (!item) {
        throw new Error(`알 수 없는 품목: "${itemKey}"`);
      }

      if (item.categoryCode !== cat.code) {
        throw new Error(
          `카테고리/품목 불일치: 활동유형="${categoryKey}", 품목="${itemKey}"`
        );
      }

      const unit = String(unitRaw ?? "").trim();
      if (unit !== item.unit) {
        throw new Error(
          `단위 불일치: 기대="${item.unit}", 입력="${unit}" (품목 ${itemKey})`
        );
      }

      const parsed = RowSchema.parse({
        occurredAt: dateRaw,
        categoryCode: cat.code,
        itemCode: item.code,
        amount: amountRaw,
        unit,
      });

      rows.push(parsed);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push({ rowIndex, raw, message });
    }
  });

  return {
    rows,
    errors,
    totalRows: json.length,
    sheetName,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 보조 함수
// ─────────────────────────────────────────────────────────────────────────────

/** 워크북에서 활동 데이터 시트를 자동 선택한다. */
function pickActivitySheet(wb: XLSX.WorkBook): string {
  // 우선순위: '활동' 또는 'CT-' 키워드 포함 → 없으면 첫 번째 시트
  const cand = wb.SheetNames.find((n) => /활동|CT-/i.test(n));
  return cand ?? wb.SheetNames[0];
}

/**
 * 헤더 행 번호를 자동 탐지한다 (헤더가 1행이 아닐 수 있음 — 과제 시트는 3행).
 * 0-based 반환.
 */
function detectHeaderRow(sheet: XLSX.WorkSheet): number {
  const ref = sheet["!ref"];
  if (!ref) return 0;
  const range = XLSX.utils.decode_range(ref);
  const limit = Math.min(range.s.r + 100, range.e.r);

  for (let r = range.s.r; r <= limit; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      const v = String(cell.v ?? "").trim();
      if (v === COLUMN.date || v === "일자" || v === COLUMN.category) {
        return r;
      }
    }
  }
  return 0;
}
