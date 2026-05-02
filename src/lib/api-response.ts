// 응답 컨벤션:
//   성공 { data, meta? }
//   실패 { error: { code, message, details? } }

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  DomainError,
  InvalidFactorUnitError,
  MissingFactorError,
  UnitMismatchError,
  UnknownItemError,
} from "@/domain/errors";

interface ApiSuccess<T> {
  data: T;
  meta?: Record<string, unknown>;
}

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  const body: ApiSuccess<T> = meta ? { data, meta } : { data };
  return NextResponse.json(body);
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown
) {
  const body: ApiError = {
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

export function handleError(e: unknown): NextResponse {
  if (e instanceof MissingFactorError) {
    return fail("MISSING_FACTOR", e.message, 422, {
      itemCode: e.itemCode,
      occurredAt: e.occurredAt.toISOString().slice(0, 10),
    });
  }
  if (e instanceof UnitMismatchError) {
    return fail("UNIT_MISMATCH", e.message, 400, {
      itemCode: e.itemCode,
      activityUnit: e.activityUnit,
      expectedUnit: e.expectedUnit,
    });
  }
  if (e instanceof UnknownItemError) {
    return fail("UNKNOWN_ITEM", e.message, 400, { itemCode: e.itemCode });
  }
  if (e instanceof InvalidFactorUnitError) {
    return fail("INVALID_FACTOR_UNIT", e.message, 500, {
      factorUnit: e.factorUnit,
    });
  }
  if (e instanceof DomainError) {
    return fail("DOMAIN_ERROR", e.message, 422);
  }
  if (e instanceof ZodError) {
    return fail(
      "VALIDATION_ERROR",
      "입력값이 유효하지 않습니다.",
      400,
      e.format()
    );
  }
  if (e instanceof SyntaxError) {
    return fail("INVALID_JSON", "요청 본문이 유효한 JSON이 아닙니다.", 400);
  }
  console.error("[API ERROR]", e);
  return fail(
    "INTERNAL",
    e instanceof Error ? e.message : "서버 내부 오류",
    500
  );
}
