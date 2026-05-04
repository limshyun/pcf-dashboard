import type { Metadata } from "next";

import { DocsSwagger } from "./docs-swagger";

export const metadata: Metadata = {
  title: "API 문서",
  description: "PCF Dashboard REST API (OpenAPI 3.0)",
};

export default function DocsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          REST API 문서
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          스펙 JSON:{" "}
          <a
            className="text-primary underline-offset-4 hover:underline"
            href="/api/v1/openapi"
          >
            /api/v1/openapi
          </a>
        </p>
      </header>
      <DocsSwagger />
    </main>
  );
}
