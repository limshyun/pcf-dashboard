import { NextRequest } from "next/server";

import { handleError, ok } from "@/src/lib/api-response";
import {
  DashboardRangeSchema,
  getSummary,
} from "@/src/services/dashboard-service";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = DashboardRangeSchema.parse(
      Object.fromEntries(url.searchParams)
    );
    const summary = await getSummary(range);
    return ok(summary);
  } catch (e) {
    return handleError(e);
  }
}
