/**
 * 도메인 에러.
 *
 * 순수 도메인 계층에서 발생하는 에러를 명시적 클래스로 정의한다.
 * UI/API 레이어에서는 `instanceof`로 분기하여 사용자 친화적 메시지로 변환한다.
 */

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** 활동 일자에 유효한 배출계수 버전을 찾을 수 없을 때. */
export class MissingFactorError extends DomainError {
  constructor(
    public readonly itemCode: string,
    public readonly occurredAt: Date
  ) {
    super(
      `활동 일자(${occurredAt.toISOString().slice(0, 10)})에 유효한 배출계수가 없습니다 (품목: ${itemCode}).`
    );
  }
}

/** 활동 단위와 배출계수의 분모 단위가 일치하지 않을 때. */
export class UnitMismatchError extends DomainError {
  constructor(
    public readonly itemCode: string,
    public readonly activityUnit: string,
    public readonly expectedUnit: string
  ) {
    super(
      `단위 불일치: 품목 ${itemCode}의 활동 단위는 "${expectedUnit}"이어야 하지만 "${activityUnit}"로 입력되었습니다.`
    );
  }
}

/** 배출계수의 단위 형식이 "X/Y" 꼴이 아닐 때 (예: "kgCO2e" 처럼 분모 누락). */
export class InvalidFactorUnitError extends DomainError {
  constructor(public readonly factorUnit: string) {
    super(
      `배출계수 단위 형식 오류: "${factorUnit}" — "kgCO2e/kWh"처럼 "<배출량 단위>/<활동량 단위>" 형식이어야 합니다.`
    );
  }
}

/** 알 수 없는 품목 코드. */
export class UnknownItemError extends DomainError {
  constructor(public readonly itemCode: string) {
    super(`알 수 없는 품목 코드: "${itemCode}"`);
  }
}
