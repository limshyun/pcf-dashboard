import { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api-response";
import {
  ByItemQuerySchema,
  getByItem,
} from "@/services/dashboard-service";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = ByItemQuerySchema.parse(
      Object.fromEntries(url.searchParams)
    );
    const result = await getByItem(query);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
