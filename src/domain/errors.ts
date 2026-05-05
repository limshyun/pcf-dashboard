export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

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

export class InvalidFactorUnitError extends DomainError {
  constructor(public readonly factorUnit: string) {
    super(
      `배출계수 단위 형식 오류: "${factorUnit}" — "kgCO2e/kWh"처럼 "<배출량 단위>/<활동량 단위>" 형식이어야 합니다.`
    );
  }
}

export class UnknownItemError extends DomainError {
  constructor(public readonly itemCode: string) {
    super(`알 수 없는 품목 코드: "${itemCode}"`);
  }
}
