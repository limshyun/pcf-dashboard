import { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api-response";
import {
  ActivityCreateSchema,
  ActivityListQuerySchema,
  countActivities,
  createActivity,
  listActivities,
  listActivitiesWithEmissions,
} from "@/services/activity-service";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams);
    const includeEmissions =
      params.includeEmissions === "1" || params.includeEmissions === "true";
    delete params.includeEmissions;
    const filter = ActivityListQuerySchema.parse(params);

    if (includeEmissions) {
      const { rows, total } = await listActivitiesWithEmissions(filter);
      return ok(rows, {
        total,
        limit: filter.limit ?? 50,
        offset: filter.offset ?? 0,
      });
    }

    const { limit, offset, ...countFilter } = filter;
    const list = await listActivities(filter);
    const total = await countActivities(countFilter);

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
      { total, limit: limit ?? null, offset: offset ?? null }
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
