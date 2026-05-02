import { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api-response";
import {
  ActivityCreateSchema,
  ActivityListQuerySchema,
  createActivity,
  listActivities,
} from "@/services/activity-service";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const filter = ActivityListQuerySchema.parse(
      Object.fromEntries(url.searchParams)
    );
    const list = await listActivities(filter);

    return ok(
      list.map((a) => ({
        id: a.id,
        itemCode: a.item.code,
        itemName: a.item.name,
        categoryCode: a.item.category.code,
        scope: a.item.category.scope,
        occurredAt: a.occurredAt.toISOString().slice(0, 10),
        amount: a.amount.toString(),
        unit: a.unit,
        memo: a.memo,
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
    const input = ActivityCreateSchema.parse(body);
    const a = await createActivity(input);
    return ok({
      id: a.id,
      itemCode: a.item.code,
      occurredAt: a.occurredAt.toISOString().slice(0, 10),
      amount: a.amount.toString(),
      unit: a.unit,
    });
  } catch (e) {
    return handleError(e);
  }
}
