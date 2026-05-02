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
      list.map((f) => ({
        id: f.id,
        itemCode: f.item.code,
        itemName: f.item.name,
        version: f.version,
        value: f.value.toString(),
        unit: f.unit,
        validFrom: f.validFrom.toISOString().slice(0, 10),
        validTo: f.validTo?.toISOString().slice(0, 10) ?? null,
        source: f.source,
        note: f.note,
      })),
      { count: list.length }
    );
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = FactorCreateSchema.parse(body);
    const f = await createFactorVersion(input);
    return ok({
      id: f.id,
      itemCode: f.item.code,
      version: f.version,
      value: f.value.toString(),
      unit: f.unit,
      validFrom: f.validFrom.toISOString().slice(0, 10),
      validTo: f.validTo?.toISOString().slice(0, 10) ?? null,
    });
  } catch (e) {
    return handleError(e);
  }
}
