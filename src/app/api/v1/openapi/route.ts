import { NextResponse } from "next/server";

import { getOpenApiDocument } from "@/lib/openapi-spec";

export async function GET() {
  const spec = getOpenApiDocument();
  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
