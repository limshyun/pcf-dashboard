"use client";

/**
 * 차트 컨테이너 컴파운드 컴포넌트.
 *
 * 4종 차트가 공유하던 boilerplate(Card → Header → Skeleton/Empty → ResponsiveContainer)를
 * 한 곳으로 모아 새 차트 추가 비용을 낮춘다.
 *
 * 사용 예:
 *   <ChartCard>
 *     <ChartCard.Header>
 *       <ChartCard.Title>월별 추이</ChartCard.Title>
 *       <ChartCard.Action><Button .../></ChartCard.Action>  // 옵션
 *     </ChartCard.Header>
 *     <ChartCard.Body loading={loading} isEmpty={!data?.length}>
 *       <ResponsiveContainer ...>...</ResponsiveContainer>
 *     </ChartCard.Body>
 *   </ChartCard>
 *
 * Body는 마운트 후에만 children을 렌더 → Recharts ResponsiveContainer의
 * 첫 paint width(-1) 콘솔 경고를 제거한다.
 */

import { useEffect, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RootProps extends React.ComponentProps<"div"> {
  className?: string;
  children: React.ReactNode;
}

function Root({ className, children, ...rest }: RootProps) {
  return (
    <Card className={cn("min-w-0", className)} {...rest}>
      {children}
    </Card>
  );
}

function Header({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <CardHeader className={cn("flex flex-row items-center justify-between gap-2", className)}>
      {children}
    </CardHeader>
  );
}

function Title({ className, children }: { className?: string; children: React.ReactNode }) {
  return <CardTitle className={cn("text-base", className)}>{children}</CardTitle>;
}

function Action({ children }: { children: React.ReactNode }) {
  return <div className="ml-auto">{children}</div>;
}

export interface ChartSize {
  width: number;
  height: number;
}

interface BodyProps {
  loading?: boolean;
  isEmpty?: boolean;
  emptyText?: string;
  height?: number;
  /**
   * Recharts 차트를 size 인자와 함께 반환한다.
   * Recharts ResponsiveContainer가 첫 paint에서 width(-1)로 측정하는 이슈를 회피하기 위해
   * 컨테이너 실제 size를 직접 측정해 children에게 명시적으로 전달한다.
   */
  children: (size: ChartSize) => React.ReactNode;
}

function Body({
  loading = false,
  isEmpty = false,
  emptyText = "해당 기간에 데이터가 없습니다.",
  height = 288,
  children,
}: BodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ChartSize | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w > 0 && h > 0) setSize({ width: w, height: h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <CardContent>
      <div ref={containerRef} className="w-full min-w-0" style={{ height }}>
        {loading || !size ? (
          <Skeleton className="h-full w-full" />
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          children(size)
        )}
      </div>
    </CardContent>
  );
}

export const ChartCard = Object.assign(Root, {
  Header,
  Title,
  Action,
  Body,
});
