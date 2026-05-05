import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";

import {
  InvalidFactorUnitError,
  MissingFactorError,
  UnitMismatchError,
} from "../errors";
import {
  type ActivityInput,
  type EmissionFactorInput,
  calculateEmission,
  calculateEmissions,
  extractActivityUnitFromFactor,
  pickFactorAt,
} from "../pcf-calculator";

const electricityCategory = { code: "ELECTRICITY", scope: 2 };
const transportCategory = { code: "TRANSPORT", scope: 3 };

const kepcoActivity = (occurredAt: string, amount: number, unit = "kWh"): ActivityInput => ({
  occurredAt: new Date(occurredAt),
  amount,
  unit,
  item: { code: "KEPCO", unit: "kWh", category: electricityCategory },
});

const truckActivity = (occurredAt: string, amount: number): ActivityInput => ({
  occurredAt: new Date(occurredAt),
  amount,
  unit: "ton-km",
  item: { code: "TRUCK", unit: "ton-km", category: transportCategory },
});

const kepcoFactorV1: EmissionFactorInput = {
  itemCode: "KEPCO",
  value: 0.4781,
  unit: "kgCO2e/kWh",
  version: 1,
  validFrom: new Date("2024-01-01"),
  validTo: new Date("2025-01-01"),
};

const kepcoFactorV2: EmissionFactorInput = {
  itemCode: "KEPCO",
  value: 0.456,
  unit: "kgCO2e/kWh",
  version: 2,
  validFrom: new Date("2025-01-01"),
  validTo: null,
};

const truckFactor: EmissionFactorInput = {
  itemCode: "TRUCK",
  value: 3.5,
  unit: "kgCO2e/ton-km",
  version: 1,
  validFrom: new Date("2025-01-01"),
  validTo: null,
};

describe("extractActivityUnitFromFactor", () => {
  it("정상 형식의 분모를 반환한다", () => {
    expect(extractActivityUnitFromFactor("kgCO2e/kWh")).toBe("kWh");
    expect(extractActivityUnitFromFactor("kgCO2e/ton-km")).toBe("ton-km");
    expect(extractActivityUnitFromFactor("kgCO2e / kg")).toBe("kg");
  });

  it("분모가 없으면 InvalidFactorUnitError를 던진다", () => {
    expect(() => extractActivityUnitFromFactor("kgCO2e")).toThrow(
      InvalidFactorUnitError
    );
    expect(() => extractActivityUnitFromFactor("kgCO2e/")).toThrow(
      InvalidFactorUnitError
    );
  });
});

describe("pickFactorAt", () => {
  const factors = [kepcoFactorV1, kepcoFactorV2, truckFactor];

  it("activity 일자가 v1 범위면 v1을 선택한다", () => {
    const f = pickFactorAt(factors, "KEPCO", new Date("2024-06-15"));
    expect(f?.version).toBe(1);
  });

  it("activity 일자가 v1과 v2의 경계(validTo=validFrom)이면 v2를 선택한다", () => {
    const f = pickFactorAt(factors, "KEPCO", new Date("2025-01-01"));
    expect(f?.version).toBe(2);
  });

  it("v2의 validTo가 null이면 미래 일자도 v2로 매칭된다", () => {
    const f = pickFactorAt(factors, "KEPCO", new Date("2030-12-31"));
    expect(f?.version).toBe(2);
  });

  it("validFrom 이전 일자는 매칭되지 않는다", () => {
    const f = pickFactorAt(factors, "KEPCO", new Date("2023-12-31"));
    expect(f).toBeNull();
  });

  it("itemCode가 다르면 매칭되지 않는다", () => {
    const f = pickFactorAt(factors, "PLASTIC_1", new Date("2025-06-01"));
    expect(f).toBeNull();
  });
});

describe("calculateEmission", () => {
  it("KEPCO 110 kWh × 0.456 = 50.16 kgCO2e (v2)", () => {
    const r = calculateEmission(kepcoActivity("2025-05-01", 110), [
      kepcoFactorV1,
      kepcoFactorV2,
    ]);
    expect(r.co2eKg.toString()).toBe("50.16");
    expect(r.factorVersion).toBe(2);
    expect(r.scope).toBe(2);
    expect(r.itemCode).toBe("KEPCO");
    expect(r.categoryCode).toBe("ELECTRICITY");
  });

  it("같은 활동도 일자가 다르면 다른 버전 계수로 계산된다", () => {
    const r1 = calculateEmission(kepcoActivity("2024-06-15", 110), [
      kepcoFactorV1,
      kepcoFactorV2,
    ]);
    expect(r1.factorVersion).toBe(1);
    expect(r1.co2eKg.toString()).toBe(new Decimal("0.4781").mul(110).toString());
  });

  it("Decimal 정밀도: 0.1 + 0.2 같은 부동소수 오차 없음", () => {
    const factor: EmissionFactorInput = {
      ...kepcoFactorV2,
      value: 0.1,
    };
    const r = calculateEmission(kepcoActivity("2025-05-01", 0.2), [factor]);
    expect(r.co2eKg.toString()).toBe("0.02");
  });

  it("계수가 없으면 MissingFactorError를 던진다", () => {
    expect(() =>
      calculateEmission(kepcoActivity("2023-12-31", 110), [
        kepcoFactorV1,
        kepcoFactorV2,
      ])
    ).toThrow(MissingFactorError);
  });

  it("활동 단위가 계수 분모와 다르면 UnitMismatchError를 던진다", () => {
    expect(() =>
      calculateEmission(kepcoActivity("2025-05-01", 110, "MWh"), [
        kepcoFactorV2,
      ])
    ).toThrow(UnitMismatchError);
  });

  it("계수 단위 형식이 잘못되면 InvalidFactorUnitError를 던진다", () => {
    const badFactor: EmissionFactorInput = {
      ...kepcoFactorV2,
      unit: "kgCO2e", // 분모 없음
    };
    expect(() =>
      calculateEmission(kepcoActivity("2025-05-01", 110), [badFactor])
    ).toThrow(InvalidFactorUnitError);
  });
});

describe("calculateEmissions", () => {
  it("성공/실패 행을 분리하여 반환한다", () => {
    const activities: ActivityInput[] = [
      kepcoActivity("2025-05-01", 110),
      kepcoActivity("2023-12-31", 100), // MissingFactor
      truckActivity("2025-06-01", 41),
      kepcoActivity("2025-05-01", 50, "MWh"), // UnitMismatch
    ];
    const { results, failures } = calculateEmissions(activities, [
      kepcoFactorV1,
      kepcoFactorV2,
      truckFactor,
    ]);

    expect(results).toHaveLength(2);
    expect(failures).toHaveLength(2);

    const truck = results.find((row) => row.itemCode === "TRUCK");
    expect(truck?.co2eKg.toString()).toBe("143.5");

    expect(failures[0].error).toBeInstanceOf(MissingFactorError);
    expect(failures[1].error).toBeInstanceOf(UnitMismatchError);
  });
});
