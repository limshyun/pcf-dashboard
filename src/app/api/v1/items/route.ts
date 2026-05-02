import { handleError, ok } from "@/lib/api-response";
import { listItems } from "@/services/master-service";

export async function GET() {
  try {
    const items = await listItems();
    return ok(
      items.map((i) => ({
        code: i.code,
        name: i.name,
        unit: i.unit,
        categoryCode: i.category.code,
        categoryName: i.category.name,
        scope: i.category.scope,
      })),
      { count: items.length }
    );
  } catch (e) {
    return handleError(e);
  }
}
