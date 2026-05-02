import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";

import {
  aggregateByCategory,
  aggregateByItem,
  aggregateByMonth,
  aggregateByScope,
  totalEmission,
} from "../pcf-aggregator";
import type { EmissionResult } from "../pcf-calculator";

// ─────────────────────────────────────────────────────────────────────────────
// 픽스처
//   - KEPCO (Scope2): 5월 50.16, 5월 추가 46.056, 6월 50.16
//   - PLASTIC_1 (Scope3): 5월 974.4
//   - TRUCK (Scope3): 6월 143.5
// ─────────────────────────────────────────────────────────────────────────────

const make = (
  itemCode: string,
  categoryCode: string,
  scope: number,
  occurredAt: string,
  co2eKg: string
): EmissionResult => ({
  itemCode,
  categoryCode,
  scope,
  factorVersion: 1,
  occurredAt: new Date(occurredAt),
  co2eKg: new Decimal(co2eKg),
});

const results: EmissionResult[] = [
  make("KEPCO", "ELECTRICITY", 2, "2025-05-01", "50.16"),
  make("KEPCO", "ELECTRICITY", 2, "2025-05-15", "46.056"),
  make("KEPCO", "ELECTRICITY", 2, "2025-06-01", "50.16"),
  make("PLASTIC_1", "MATERIAL", 3, "2025-05-01", "974.4"),
  make("TRUCK", "TRANSPORT", 3, "2025-06-01", "143.5"),
];

const TOTAL = "1264.276"; // 50.16 + 46.056 + 50.16 + 974.4 + 143.5

// ─────────────────────────────────────────────────────────────────────────────
// totalEmission
// ─────────────────────────────────────────────────────────────────────────────

describe("totalEmission", () => {
  it("모든 결과의 co2eKg를 합산한다", () => {
    expect(totalEmission(results).toString()).toBe(TOTAL);
  });

  it("빈 배열은 0을 반환한다", () => {
    expect(totalEmission([]).toString()).toBe("0");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// aggregateByMonth
// ─────────────────────────────────────────────────────────────────────────────

describe("aggregateByMonth", () => {
  it("YYYY-MM 키로 합산하고 오름차순 정렬한다", () => {
    const buckets = aggregateByMonth(results);
    expect(buckets).toHaveLength(2);

    expect(buckets[0].yearMonth).toBe("2025-05");
    // 50.16 + 46.056 + 974.4
    expect(buckets[0].co2eKg.toString()).toBe("1070.616");

    expect(buckets[1].yearMonth).toBe("2025-06");
    // 50.16 + 143.5
    expect(buckets[1].co2eKg.toString()).toBe("193.66");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// aggregateByCategory
// ─────────────────────────────────────────────────────────────────────────────

describe("aggregateByCategory", () => {
  it("카테고리별 합산 + 비율을 반환하고 큰 값부터 정렬한다", () => {
    const buckets = aggregateByCategory(results);
    expect(buckets).toHaveLength(3);

    // MATERIAL이 974.4로 가장 큼
    expect(buckets[0].categoryCode).toBe("MATERIAL");
    expect(buckets[0].co2eKg.toString()).toBe("974.4");
    expect(buckets[0].ratio).toBeCloseTo(974.4 / 1264.276, 4);

    // ELECTRICITY 146.376 (= 50.16 + 46.056 + 50.16, 3건 합산)
    expect(buckets[1].categoryCode).toBe("ELECTRICITY");
    expect(buckets[1].co2eKg.toString()).toBe("146.376");

    // TRANSPORT 143.5
    expect(buckets[2].categoryCode).toBe("TRANSPORT");
    expect(buckets[2].co2eKg.toString()).toBe("143.5");

    // 비율 합 ≈ 1
    const ratioSum = buckets.reduce((s, b) => s + b.ratio, 0);
    expect(ratioSum).toBeCloseTo(1, 6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// aggregateByScope
// ─────────────────────────────────────────────────────────────────────────────

describe("aggregateByScope", () => {
  it("Scope 별로 합산하고 작은 Scope부터 정렬한다", () => {
    const buckets = aggregateByScope(results);
    expect(buckets).toHaveLength(2);

    // Scope2 = ELECTRICITY 합 = 146.376
    expect(buckets[0].scope).toBe(2);
    expect(buckets[0].co2eKg.toString()).toBe("146.376");

    // Scope3 = MATERIAL + TRANSPORT = 1117.9
    expect(buckets[1].scope).toBe(3);
    expect(buckets[1].co2eKg.toString()).toBe("1117.9");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// aggregateByItem
// ─────────────────────────────────────────────────────────────────────────────

describe("aggregateByItem", () => {
  it("품목별 합산을 큰 값부터 반환한다", () => {
    const buckets = aggregateByItem(results);
    // 974.4 > 146.376 (KEPCO 3건 합) > 143.5 (TRUCK)
    expect(buckets.map((bucket) => bucket.itemCode)).toEqual([
      "PLASTIC_1",
      "KEPCO",
      "TRUCK",
    ]);
    expect(buckets[2].co2eKg.toString()).toBe("143.5");
  });

  it("topN 인자로 상위 N개만 반환한다", () => {
    const top2 = aggregateByItem(results, 2);
    expect(top2).toHaveLength(2);
    expect(top2[0].itemCode).toBe("PLASTIC_1");
    expect(top2[1].itemCode).toBe("KEPCO");
  });
});
