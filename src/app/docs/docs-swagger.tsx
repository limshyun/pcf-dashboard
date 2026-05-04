"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <p className="py-12 text-center text-sm text-muted-foreground">
      API 문서 UI 로드 중…
    </p>
  ),
});

export function DocsSwagger() {
  return (
    <div className="min-h-[70vh] [&_.swagger-ui]:text-foreground">
      <SwaggerUI url="/api/v1/openapi" deepLinking docExpansion="list" />
    </div>
  );
}
