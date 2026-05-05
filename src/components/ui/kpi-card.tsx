"use client";

/** KPI 카드·그리드 컴파운드 */

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiGridProps {
  className?: string;
  children: React.ReactNode;
}

export function KpiGrid({ className, children }: KpiGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  /** 값 아래 작은 보조 텍스트 또는 Badge 등 자유 슬롯 */
  hint?: React.ReactNode;
  /** 값에 강조색(예: 실패 카운트가 0보다 클 때) 부여 */
  emphasis?: "default" | "destructive";
  className?: string;
}

function KpiCardRoot({
  label,
  value,
  unit,
  hint,
  emphasis = "default",
  className,
}: KpiCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-heading text-3xl font-semibold tabular-nums",
              emphasis === "destructive" && "text-destructive"
            )}
          >
            {value}
          </span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {hint && <div className="mt-1 text-sm text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function KpiCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
      </CardContent>
    </Card>
  );
}

export const KpiCard = Object.assign(KpiCardRoot, {
  Skeleton: KpiCardSkeleton,
});
