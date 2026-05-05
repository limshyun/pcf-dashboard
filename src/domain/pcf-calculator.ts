/** PCF 계산: 시점별 계수 매칭·단위 검증·활동량×계수. 순수 함수. */

import Decimal from "decimal.js";

import {
  InvalidFactorUnitError,
  MissingFactorError,
  UnitMismatchError,
} from "./errors";

export interface ActivityInput {
  occurredAt: Date;
  amount: Decimal | number | string;
  unit: string;
  item: {
    code: string;
    unit: string;
    category: {
      code: string;
      scope: number;
    };
  };
}

export interface EmissionFactorInput {
  itemCode: string;
  value: Decimal | number | string;
  unit: string; // "kgCO2e/kWh" 형식
  version: number;
  validFrom: Date;
  validTo: Date | null;
}

export interface EmissionResult {
  co2eKg: Decimal;
  factorVersion: number;
  scope: number;
  itemCode: string;
  categoryCode: string;
  occurredAt: Date;
}

/** validFrom ≤ occurredAt < validTo(null이면 상한 없음). 동일 구간 다중 버전이면 version 큰 것. */
export function pickFactorAt(
  factors: readonly EmissionFactorInput[],
  itemCode: string,
  occurredAt: Date
): EmissionFactorInput | null {
  const candidates = factors
    .filter((factor) => factor.itemCode === itemCode)
    .filter((factor) => factor.validFrom.getTime() <= occurredAt.getTime())
    .filter(
      (factor) =>
        !factor.validTo || occurredAt.getTime() < factor.validTo.getTime()
    )
    .sort((a, b) => b.version - a.version);

  return candidates[0] ?? null;
}

/** 계수 단위 문자열에서 활동량 단위(분모) 추출. 예: kgCO2e/kWh → kWh */
export function extractActivityUnitFromFactor(factorUnit: string): string {
  const parts = factorUnit.split("/");
  if (parts.length !== 2 || !parts[1].trim()) {
    throw new InvalidFactorUnitError(factorUnit);
  }
  return parts[1].trim();
}

/** 배출량(kgCO2e) = 활동량 × 계수값 */
export function calculateEmission(
  activity: ActivityInput,
  factors: readonly EmissionFactorInput[]
): EmissionResult {
  const factor = pickFactorAt(factors, activity.item.code, activity.occurredAt);
  if (!factor) {
    throw new MissingFactorError(activity.item.code, activity.occurredAt);
  }

  const expectedUnit = extractActivityUnitFromFactor(factor.unit);
  if (expectedUnit !== activity.unit) {
    throw new UnitMismatchError(
      activity.item.code,
      activity.unit,
      expectedUnit
    );
  }

  const amount = new Decimal(activity.amount.toString());
  const value = new Decimal(factor.value.toString());

  return {
    co2eKg: amount.mul(value),
    factorVersion: factor.version,
    scope: activity.item.category.scope,
    itemCode: activity.item.code,
    categoryCode: activity.item.category.code,
    occurredAt: activity.occurredAt,
  };
}

export interface CalculationFailure {
  activity: ActivityInput;
  error: Error;
}

export interface BatchCalculationResult {
  results: EmissionResult[];
  failures: CalculationFailure[];
}

/** 다건 계산. 실패 행은 failures에 보존 */
export function calculateEmissions(
  activities: readonly ActivityInput[],
  factors: readonly EmissionFactorInput[]
): BatchCalculationResult {
  const results: EmissionResult[] = [];
  const failures: CalculationFailure[] = [];

  for (const activity of activities) {
    try {
      results.push(calculateEmission(activity, factors));
    } catch (calcError) {
      failures.push({
        activity,
        error:
          calcError instanceof Error ? calcError : new Error(String(calcError)),
      });
    }
  }

  return { results, failures };
}
