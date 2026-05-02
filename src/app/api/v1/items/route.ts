import { handleError, ok } from "@/lib/api-response";
import { listItems } from "@/services/master-service";

export async function GET() {
  try {
    const items = await listItems();
    return ok(
      items.map((item) => ({
        code: item.code,
        name: item.name,
        unit: item.unit,
        categoryCode: item.category.code,
        categoryName: item.category.name,
        scope: item.category.scope,
      })),
      { count: items.length }
    );
  } catch (error) {
    return handleError(error);
  }
}
