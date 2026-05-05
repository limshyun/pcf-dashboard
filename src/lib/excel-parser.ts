/** 과제용 활동 엑셀 파서. 시드·임포트 공유. DB 미사용. */

import * as XLSX from "xlsx";
import { z } from "zod";

const COLUMN = {
  date: "일자(원본)",
  category: "활동 유형",
  itemName: "설명",
  amount: "량",
  unit: "단위",
} as const;

const AMOUNT_KEYS = ["량", "양"] as const;

const CATEGORY_MAP = {
  전기: { code: "ELECTRICITY", scope: 2 },
  원소재: { code: "MATERIAL", scope: 3 },
  운송: { code: "TRANSPORT", scope: 3 },
} as const;

const ITEM_MAP = {
  한국전력: { code: "KEPCO", categoryCode: "ELECTRICITY", unit: "kWh" },
  "플라스틱 1": { code: "PLASTIC_1", categoryCode: "MATERIAL", unit: "kg" },
  "플라스틱 2": { code: "PLASTIC_2", categoryCode: "MATERIAL", unit: "kg" },
  트럭: { code: "TRUCK", categoryCode: "TRANSPORT", unit: "ton-km" },
} as const;

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

const RowSchema = z.object({
  occurredAt: z.coerce.date(),
  categoryCode: z.string(),
  itemCode: z.string(),
  amount: z.coerce.number().positive(),
  unit: z.string(),
});

export type ParsedActivityRow = z.infer<typeof RowSchema>;

export interface ParsedRowError {
  rowIndex: number;
  raw: Record<string, unknown>;
  message: string;
}

export interface ParseResult {
  rows: ParsedActivityRow[];
  errors: ParsedRowError[];
  totalRows: number;
  sheetName: string;
}

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
      const amountRaw =
        AMOUNT_KEYS.map((columnKey) => raw[columnKey]).find(
          (cell) => cell != null
        ) ?? null;
      const unitRaw = raw[COLUMN.unit];

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
    } catch (parseError) {
      const message =
        parseError instanceof Error ? parseError.message : String(parseError);
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

function pickActivitySheet(wb: XLSX.WorkBook): string {
  const byName = wb.SheetNames.find((sheetName) =>
    /활동|CT-|과제용\s*데이터|raw|activity/i.test(sheetName)
  );
  if (byName) return byName;
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    if (hasHeader(sheet)) return sheetName;
  }
  return wb.SheetNames[0];
}

function hasHeader(sheet: XLSX.WorkSheet): boolean {
  const ref = sheet["!ref"];
  if (!ref) return false;
  const range = XLSX.utils.decode_range(ref);
  const limit = Math.min(range.s.r + 100, range.e.r);
  for (let r = range.s.r; r <= limit; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      const v = String(cell.v ?? "").trim();
      if (v === COLUMN.date || v === "일자" || v === COLUMN.category) {
        return true;
      }
    }
  }
  return false;
}

/** 헤더 행 0-based (과제 시트는 3행 등 변동 가능) */
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
