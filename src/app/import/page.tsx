"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useImportBatches } from "@/hooks/use-import-batches";
import {
  ApiError,
  type ImportRunResponse,
  type ImportStatus,
  importExcel,
} from "@/lib/api-client";

const STATUS_LABEL: Record<ImportStatus, string> = {
  SUCCESS: "성공",
  PARTIAL: "부분 성공",
  FAILED: "실패",
};

function statusBadge(status: ImportStatus) {
  const variant: "default" | "secondary" | "destructive" =
    status === "SUCCESS"
      ? "default"
      : status === "PARTIAL"
        ? "secondary"
        : "destructive";
  return (
    <Badge variant={variant} className="text-[10px]">
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function downloadErrorsCsv(result: ImportRunResponse) {
  const header = ["rowIndex", "message", "raw"];
  const lines = [header.join(",")];
  for (const e of result.errors) {
    const raw = JSON.stringify(e.raw).replace(/"/g, '""');
    const msg = e.message.replace(/"/g, '""');
    lines.push(`${e.rowIndex},"${msg}","${raw}"`);
  }
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `import-errors-${result.batchId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    batches,
    loading: batchesLoading,
    error: batchesError,
    reload: reloadBatches,
  } = useImportBatches();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("파일을 선택하세요");
      return;
    }
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const r = await importExcel(file);
      setResult(r);
      reloadBatches();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`[${e.code}] ${e.message}`);
      } else {
        setError(e instanceof Error ? e.message : "업로드 실패");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 md:p-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Excel 임포트
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          과제 제공 .xlsx 시트(<code>일자(원본) / 활동 유형 / 설명 / 양 / 단위</code>)를
          그대로 업로드합니다. 실패 행은 CSV로 내려받아 수정 후 재업로드할 수 있습니다.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>파일 업로드</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={onSubmit}>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setResult(null);
                  setError(null);
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {file ? `선택됨: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : "파일이 선택되지 않았습니다"}
                </p>
                <Button type="submit" disabled={!file || submitting}>
                  {submitting ? "업로드 중…" : "업로드"}
                </Button>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>결과</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                업로드 결과가 여기에 표시됩니다.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm">
                  {statusBadge(result.status)}
                  <span className="font-medium">{result.filename}</span>
                  <span className="text-muted-foreground">
                    · 시트 “{result.sheetName}”
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <Stat label="총 행" value={result.totalRows} />
                  <Stat label="성공" value={result.successCount} tone="positive" />
                  <Stat
                    label="실패"
                    value={result.failedCount}
                    tone={result.failedCount > 0 ? "negative" : "default"}
                  />
                </div>

                {result.errors.length > 0 && (
                  <div className="flex flex-col gap-2 rounded-md border border-amber-500/30 bg-amber-50/40 p-3 dark:bg-amber-950/20">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        실패 {result.errors.length}건 — 샘플 (최대 5)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => downloadErrorsCsv(result)}
                      >
                        실패 행 CSV 다운로드
                      </Button>
                    </div>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {result.errors.slice(0, 5).map((e) => (
                        <li key={e.rowIndex}>
                          <span className="font-mono">행 {e.rowIndex}</span>{" "}
                          — {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 임포트 히스토리</CardTitle>
        </CardHeader>
        <CardContent>
          {batchesError && (
            <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {batchesError}
            </div>
          )}
          {batchesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : batches.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              임포트 이력이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>일시</TableHead>
                  <TableHead>파일명</TableHead>
                  <TableHead className="text-right">총</TableHead>
                  <TableHead className="text-right">성공</TableHead>
                  <TableHead className="text-right">실패</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(b.createdAt).toLocaleString("ko-KR")}
                    </TableCell>
                    <TableCell className="font-medium">{b.filename}</TableCell>
                    <TableCell className="text-right font-mono">
                      {b.rowCount}
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {b.successCount}
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {b.failedCount}
                    </TableCell>
                    <TableCell>{statusBadge(b.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "positive" | "negative";
}) {
  const color =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "negative"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-lg font-semibold ${color}`}>
        {value.toLocaleString("ko-KR")}
      </p>
    </div>
  );
}
