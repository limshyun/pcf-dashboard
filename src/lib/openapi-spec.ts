/**
 * OpenAPI 3.0 스펙 — `/api/v1/*` REST 엔드포인트 문서화.
 * 실제 응답 래핑은 `lib/api-response.ts`와 동일: 성공 `{ data, meta? }`, 실패 `{ error }`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- OpenAPI JSON 트리 */
export function getOpenApiDocument(): Record<string, any> {
  const apiError = {
    type: "object",
    required: ["error"],
    properties: {
      error: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string" },
          details: { type: "object", additionalProperties: true },
        },
      },
    },
  };

  const dateRangeQuery = [
    {
      name: "from",
      in: "query",
      schema: { type: "string", format: "date" },
      description: "시작일(포함), YYYY-MM-DD",
    },
    {
      name: "to",
      in: "query",
      schema: { type: "string", format: "date" },
      description: "종료일(미포함), YYYY-MM-DD",
    },
  ];

  return {
    openapi: "3.0.3",
    info: {
      title: "PCF Dashboard API",
      version: "1.0.0",
      description:
        "제품별 탄소 발자국(PCF) 대시보드용 REST API. 모든 성공 응답은 `data`에 본문이 담기며, 목록류는 `meta`(total 등)를 둘 수 있습니다.",
    },
    servers: [
      {
        url: "/",
        description: "동일 출처 (로컬: http://localhost:3000)",
      },
    ],
    tags: [
      { name: "dashboard", description: "대시보드 집계" },
      { name: "activities", description: "활동 CRUD" },
      { name: "items", description: "품목 마스터" },
      { name: "emission-factors", description: "배출계수 버전" },
      { name: "import", description: "Excel 임포트" },
    ],
    paths: {
      "/api/v1/dashboard/summary": {
        get: {
          tags: ["dashboard"],
          summary: "요약 KPI",
          parameters: dateRangeQuery,
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "object", additionalProperties: true },
                    },
                  },
                },
              },
            },
            default: {
              description: "오류",
              content: { "application/json": { schema: apiError } },
            },
          },
        },
      },
      "/api/v1/dashboard/by-month": {
        get: {
          tags: ["dashboard"],
          summary: "월별 배출 버킷",
          parameters: dateRangeQuery,
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { type: "object" } },
                  },
                },
              },
            },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
      },
      "/api/v1/dashboard/by-category": {
        get: {
          tags: ["dashboard"],
          summary: "카테고리별 배출",
          parameters: dateRangeQuery,
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { type: "object" } },
                  },
                },
              },
            },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
      },
      "/api/v1/dashboard/by-item": {
        get: {
          tags: ["dashboard"],
          summary: "품목별 Top N",
          parameters: [
            ...dateRangeQuery,
            {
              name: "topN",
              in: "query",
              schema: { type: "integer", minimum: 1 },
              description: "상위 N개 (기본 5)",
            },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { type: "object" } },
                  },
                },
              },
            },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
      },
      "/api/v1/dashboard/activity-lines": {
        get: {
          tags: ["dashboard"],
          summary: "활동 원장 + 건별 PCF(페이지네이션)",
          parameters: [
            ...dateRangeQuery,
            {
              name: "page",
              in: "query",
              schema: { type: "integer", minimum: 1, default: 1 },
            },
            {
              name: "pageSize",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
            },
          ],
          responses: {
            "200": {
              description: "OK — data.rows, data.total, data.page, data.pageSize",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { type: "object" } } },
                },
              },
            },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
      },
      "/api/v1/activities": {
        get: {
          tags: ["activities"],
          summary: "활동 목록",
          parameters: [
            ...dateRangeQuery,
            {
              name: "categoryCode",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "itemCode",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100 },
            },
            {
              name: "offset",
              in: "query",
              schema: { type: "integer", minimum: 0 },
            },
            {
              name: "includeEmissions",
              in: "query",
              schema: { type: "string", enum: ["1", "true"] },
              description: "1이면 건별 PCF·계수 필드 포함",
            },
          ],
          responses: {
            "200": {
              description: "OK — data: 배열, meta.total",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { type: "array" } } },
                },
              },
            },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
        post: {
          tags: ["activities"],
          summary: "활동 등록",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["itemCode", "occurredAt", "amount", "unit"],
                  properties: {
                    itemCode: { type: "string", example: "KEPCO" },
                    occurredAt: { type: "string", format: "date" },
                    amount: { type: "number", exclusiveMinimum: 0 },
                    unit: { type: "string", example: "kWh" },
                    memo: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "생성된 활동 요약",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { type: "object" } } },
                },
              },
            },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
      },
      "/api/v1/activities/{id}": {
        delete: {
          tags: ["activities"],
          summary: "활동 삭제",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            "200": { description: "삭제됨" },
            "404": { description: "없음" },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
      },
      "/api/v1/items": {
        get: {
          tags: ["items"],
          summary: "품목(마스터) 목록",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { type: "array" } },
                  },
                },
              },
            },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
      },
      "/api/v1/emission-factors": {
        get: {
          tags: ["emission-factors"],
          summary: "배출계수 버전 목록",
          parameters: [
            {
              name: "itemCode",
              in: "query",
              schema: { type: "string" },
              description: "품목 코드로 필터",
            },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { type: "array" } },
                  },
                },
              },
            },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
        post: {
          tags: ["emission-factors"],
          summary: "배출계수 새 버전 추가",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["itemCode", "value", "unit", "validFrom"],
                  properties: {
                    itemCode: { type: "string" },
                    value: { type: "number", exclusiveMinimum: 0 },
                    unit: { type: "string", example: "kgCO2e/kWh" },
                    validFrom: { type: "string", format: "date" },
                    validTo: { type: "string", format: "date", nullable: true },
                    source: { type: "string" },
                    note: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "생성된 버전" },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
      },
      "/api/v1/emission-factors/recent": {
        get: {
          tags: ["emission-factors"],
          summary: "최근 생성·수정된 배출계수 버전",
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
          ],
          responses: {
            "200": { description: "OK" },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
      },
      "/api/v1/import": {
        get: {
          tags: ["import"],
          summary: "임포트 배치 히스토리",
          responses: {
            "200": { description: "OK" },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
        post: {
          tags: ["import"],
          summary: "Excel 업로드 (multipart)",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file"],
                  properties: {
                    file: { type: "string", format: "binary", description: ".xlsx" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "임포트 결과" },
            default: {
              content: { "application/json": { schema: apiError } },
            },
          },
        },
      },
    },
  };
}
