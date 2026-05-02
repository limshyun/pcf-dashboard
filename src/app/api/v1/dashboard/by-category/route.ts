import { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api-response";
import {
  DashboardRangeSchema,
  getByCategory,
} from "@/services/dashboard-service";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = DashboardRangeSchema.parse(
      Object.fromEntries(url.searchParams)
    );
    const result = await getByCategory(range);
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
