import { NextRequest } from "next/server";
import { z } from "zod";

import { handleError, ok } from "@/lib/api-response";
import { listRecentFactorVersions } from "@/services/factor-service";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { limit } = QuerySchema.parse(Object.fromEntries(url.searchParams));
    const rows = await listRecentFactorVersions(limit);
    return ok(
      rows.map((row) => ({
        id: row.id,
        itemCode: row.item.code,
        itemName: row.item.name,
        categoryCode: row.item.category.code,
        version: row.version,
        value: row.value.toString(),
        unit: row.unit,
        validFrom: row.validFrom.toISOString().slice(0, 10),
        validTo: row.validTo?.toISOString().slice(0, 10) ?? null,
        updatedAt: row.updatedAt.toISOString(),
      })),
      { count: rows.length }
    );
  } catch (error) {
    return handleError(error);
  }
}
