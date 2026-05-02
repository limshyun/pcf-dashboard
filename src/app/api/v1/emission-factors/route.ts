import { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api-response";
import {
  FactorCreateSchema,
  FactorListQuerySchema,
  createFactorVersion,
  listFactors,
} from "@/services/factor-service";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { itemCode } = FactorListQuerySchema.parse(
      Object.fromEntries(url.searchParams)
    );
    const list = await listFactors(itemCode);

    return ok(
      list.map((factor) => ({
        id: factor.id,
        itemCode: factor.item.code,
        itemName: factor.item.name,
        version: factor.version,
        value: factor.value.toString(),
        unit: factor.unit,
        validFrom: factor.validFrom.toISOString().slice(0, 10),
        validTo: factor.validTo?.toISOString().slice(0, 10) ?? null,
        source: factor.source,
        note: factor.note,
      })),
      { count: list.length }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = FactorCreateSchema.parse(body);
    const created = await createFactorVersion(input);
    return ok({
      id: created.id,
      itemCode: created.item.code,
      version: created.version,
      value: created.value.toString(),
      unit: created.unit,
      validFrom: created.validFrom.toISOString().slice(0, 10),
      validTo: created.validTo?.toISOString().slice(0, 10) ?? null,
    });
  } catch (error) {
    return handleError(error);
  }
}
