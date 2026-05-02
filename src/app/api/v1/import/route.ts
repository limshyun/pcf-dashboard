import { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api-response";
import { listImportBatches, runImport } from "@/services/import-service";

export async function GET() {
  try {
    const batches = await listImportBatches();
    return ok(
      batches.map((batch) => ({
        id: batch.id,
        filename: batch.filename,
        rowCount: batch.rowCount,
        successCount: batch.successCount,
        failedCount: batch.failedCount,
        status: batch.status,
        createdAt: batch.createdAt.toISOString(),
      })),
      { count: batches.length }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return fail(
        "INVALID_REQUEST",
        "multipart/form-data 요청이어야 합니다.",
        400
      );
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      return fail("MISSING_FILE", "file 필드가 필요합니다 (multipart/form-data).", 400);
    }
    if (file.size === 0) {
      return fail("EMPTY_FILE", "빈 파일입니다.", 400);
    }
    if (!/\.xlsx?$/i.test(file.name)) {
      return fail(
        "UNSUPPORTED_FORMAT",
        "지원하는 형식이 아닙니다. (.xlsx 또는 .xls)",
        400
      );
    }

    const buf = await file.arrayBuffer();
    const result = await runImport(file.name, buf);

    return ok(result, { batchId: result.batchId });
  } catch (error) {
    return handleError(error);
  }
}
