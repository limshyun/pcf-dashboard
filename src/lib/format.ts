// 1톤 이상이면 tCO2e, 미만이면 kgCO2e로 자동 전환

export function formatCo2e(kgString: string | number): { value: string; unit: string } {
  const kg = typeof kgString === "string" ? parseFloat(kgString) : kgString;
  if (!Number.isFinite(kg)) return { value: "0", unit: "kgCO2e" };
  if (Math.abs(kg) >= 1000) {
    return {
      value: (kg / 1000).toLocaleString("ko-KR", { maximumFractionDigits: 2 }),
      unit: "tCO2e",
    };
  }
  return {
    value: kg.toLocaleString("ko-KR", { maximumFractionDigits: 2 }),
    unit: "kgCO2e",
  };
}

export function formatRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

export function formatYearMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  return `${y.slice(2)}.${m}`;
}

export const CATEGORY_LABEL: Record<string, string> = {
  ELECTRICITY: "전기",
  MATERIAL: "원소재",
  TRANSPORT: "운송",
};

export const ITEM_LABEL: Record<string, string> = {
  KEPCO: "한국전력",
  PLASTIC_1: "플라스틱 1",
  PLASTIC_2: "플라스틱 2",
  TRUCK: "트럭",
};

// 차트 전용 oklch 팔레트 (전체 테마 토큰과 분리하여 카테고리 의미를 고정)
export const CATEGORY_COLOR: Record<string, string> = {
  ELECTRICITY: "oklch(0.78 0.16 85)",
  MATERIAL: "oklch(0.7 0.18 35)",
  TRANSPORT: "oklch(0.7 0.15 220)",
};

export const SCOPE_LABEL: Record<number, string> = {
  1: "Scope 1",
  2: "Scope 2",
  3: "Scope 3",
};
