/** EmissionResult[]를 월·카테고리·Scope·품목별 버킷으로 집계 */

import Decimal from "decimal.js";

import type { EmissionResult } from "./pcf-calculator";

export function totalEmission(results: readonly EmissionResult[]): Decimal {
  return results.reduce(
    (sum, r) => sum.add(r.co2eKg),
    new Decimal(0)
  );
}

export interface MonthlyBucket {
  yearMonth: string; // "YYYY-MM"
  co2eKg: Decimal;
}

function toYearMonth(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function aggregateByMonth(
  results: readonly EmissionResult[]
): MonthlyBucket[] {
  const map = new Map<string, Decimal>();
  for (const r of results) {
    const key = toYearMonth(r.occurredAt);
    map.set(key, (map.get(key) ?? new Decimal(0)).add(r.co2eKg));
  }
  return [...map.entries()]
    .map(([yearMonth, co2eKg]) => ({ yearMonth, co2eKg }))
    .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

export interface CategoryBucket {
  categoryCode: string;
  co2eKg: Decimal;
  ratio: number; // 0..1
}

export function aggregateByCategory(
  results: readonly EmissionResult[]
): CategoryBucket[] {
  const map = new Map<string, Decimal>();
  for (const r of results) {
    map.set(
      r.categoryCode,
      (map.get(r.categoryCode) ?? new Decimal(0)).add(r.co2eKg)
    );
  }
  const total = totalEmission(results);
  const totalNum = total.eq(0) ? 1 : Number(total);
  return [...map.entries()]
    .map(([categoryCode, co2eKg]) => ({
      categoryCode,
      co2eKg,
      ratio: Number(co2eKg) / totalNum,
    }))
    .sort((a, b) => Number(b.co2eKg) - Number(a.co2eKg));
}

export interface ScopeBucket {
  scope: number;
  co2eKg: Decimal;
  ratio: number;
}

export function aggregateByScope(
  results: readonly EmissionResult[]
): ScopeBucket[] {
  const map = new Map<number, Decimal>();
  for (const r of results) {
    map.set(r.scope, (map.get(r.scope) ?? new Decimal(0)).add(r.co2eKg));
  }
  const total = totalEmission(results);
  const totalNum = total.eq(0) ? 1 : Number(total);
  return [...map.entries()]
    .map(([scope, co2eKg]) => ({
      scope,
      co2eKg,
      ratio: Number(co2eKg) / totalNum,
    }))
    .sort((a, b) => a.scope - b.scope);
}

export interface ItemBucket {
  itemCode: string;
  co2eKg: Decimal;
}

export function aggregateByItem(
  results: readonly EmissionResult[],
  topN?: number
): ItemBucket[] {
  const map = new Map<string, Decimal>();
  for (const r of results) {
    map.set(
      r.itemCode,
      (map.get(r.itemCode) ?? new Decimal(0)).add(r.co2eKg)
    );
  }
  const sorted = [...map.entries()]
    .map(([itemCode, co2eKg]) => ({ itemCode, co2eKg }))
    .sort((a, b) => Number(b.co2eKg) - Number(a.co2eKg));
  return topN ? sorted.slice(0, topN) : sorted;
}
