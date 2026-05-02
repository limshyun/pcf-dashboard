import { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api-response";
import { deleteActivityById } from "@/services/activity-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id: raw } = await context.params;
    const id = Number(raw);
    if (!Number.isInteger(id) || id < 1) {
      return fail("INVALID_ID", "유효한 활동 ID가 아닙니다.", 400);
    }
    const deleted = await deleteActivityById(id);
    if (!deleted) {
      return fail("NOT_FOUND", "해당 활동을 찾을 수 없습니다.", 404);
    }
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}
