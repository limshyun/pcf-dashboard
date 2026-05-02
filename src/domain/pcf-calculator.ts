/**
 * PCF (Product Carbon Footprint) 계산기.
 *
 * 핵심 책임:
 *   1. 활동 일자에 유효한 배출계수 버전을 자동으로 매칭한다.
 *   2. 단위 정합성을 검증한다.
 *   3. 활동량 × 계수값 → 배출량(kgCO2e)을 정밀(Decimal)하게 계산한다.
 *
 * DB·HTTP·Prisma에 의존하지 않는 순수 함수 모음.
 * 호출자(서비스 계층)가 Prisma 결과를 ActivityInput/EmissionFactorInput로 변환해 넘긴다.
 */

import Decimal from "decimal.js";

import {
  InvalidFactorUnitError,
  MissingFactorError,
  UnitMismatchError,
} from "./errors";

// ─────────────────────────────────────────────────────────────────────────────
// 도메인 입력 타입 (DB 스키마와 분리)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// 시점 매칭
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 주어진 시점에 유효한 배출계수 버전을 선택한다.
 *
 * 유효성 정의: `validFrom <= occurredAt < validTo` (validTo가 null이면 항상 유효)
 *   - 반열림 구간을 사용해 경계일 중복을 방지한다.
 *   - 같은 itemCode 내 여러 버전이 동시 유효한 경우(데이터 오류) 가장 큰 version을 우선한다.
 *
 * @returns 매칭된 계수 또는 null (없으면 호출자가 MissingFactorError를 던짐)
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// 단위 추출
// ─────────────────────────────────────────────────────────────────────────────

/**
 * "kgCO2e/kWh" → "kWh" (분모 = 활동량 단위)를 추출한다.
 * 형식이 잘못되면 InvalidFactorUnitError를 던진다.
 */
export function extractActivityUnitFromFactor(factorUnit: string): string {
  const parts = factorUnit.split("/");
  if (parts.length !== 2 || !parts[1].trim()) {
    throw new InvalidFactorUnitError(factorUnit);
  }
  return parts[1].trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 계산 — 활동 1건
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 활동 1건에 대한 배출량을 계산한다.
 *
 * 계산식: emission(kgCO2e) = activity.amount × factor.value
 *
 * @throws MissingFactorError 시점에 유효한 계수가 없음
 * @throws UnitMismatchError 활동 단위가 계수 분모와 다름
 * @throws InvalidFactorUnitError 계수의 unit 형식이 잘못됨
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// 다건 계산 (실패 행 보존)
// ─────────────────────────────────────────────────────────────────────────────

export interface CalculationFailure {
  activity: ActivityInput;
  error: Error;
}

export interface BatchCalculationResult {
  results: EmissionResult[];
  failures: CalculationFailure[];
}

/**
 * 활동 N건을 계산한다. 한 건 실패가 전체를 막지 않는다.
 * UI/대시보드는 results만으로 집계하고, failures는 별도 영역에 표시한다.
 */
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
