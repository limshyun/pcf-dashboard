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
      list.map((activity) => ({
        id: activity.id,
        itemCode: activity.item.code,
        itemName: activity.item.name,
        categoryCode: activity.item.category.code,
        scope: activity.item.category.scope,
        occurredAt: activity.occurredAt.toISOString().slice(0, 10),
        amount: activity.amount.toString(),
        unit: activity.unit,
        memo: activity.memo,
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
    const input = ActivityCreateSchema.parse(body);
    const created = await createActivity(input);
    return ok({
      id: created.id,
      itemCode: created.item.code,
      occurredAt: created.occurredAt.toISOString().slice(0, 10),
      amount: created.amount.toString(),
      unit: created.unit,
    });
  } catch (error) {
    return handleError(error);
  }
}
