import { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api-response";
import {
  ActivityLinesQuerySchema,
  getActivityLines,
} from "@/services/dashboard-service";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = ActivityLinesQuerySchema.parse(
      Object.fromEntries(url.searchParams)
    );
    const result = await getActivityLines(query);
    return ok(result, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (error) {
    return handleError(error);
  }
}
