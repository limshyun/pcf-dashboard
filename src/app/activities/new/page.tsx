"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useItems } from "@/hooks/use-items";
import {
  ApiError,
  type ItemOption,
  createActivity,
} from "@/lib/api-client";
import { RecentActivitiesCard } from "@/components/activities/recent-activities-card";
import { CATEGORY_LABEL, SCOPE_LABEL } from "@/lib/format";

const FormSchema = z.object({
  categoryCode: z.string().optional(),
  itemCode: z.string().min(1, "품목을 선택하세요"),
  occurredAt: z
    .string()
    .min(1, "발생일을 입력하세요")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다"),
  amount: z
    .string()
    .min(1, "수량을 입력하세요")
    .refine(
      (amountText) =>
        Number.isFinite(Number(amountText)) && Number(amountText) > 0,
      {
        message: "0보다 큰 숫자를 입력하세요",
      }
    ),
  memo: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface FieldErrorMap {
  itemCode?: string;
  amount?: string;
  occurredAt?: string;
  global?: string;
}

function mapApiError(err: ApiError): FieldErrorMap {
  switch (err.code) {
    case "UNKNOWN_ITEM":
      return { itemCode: err.message };
    case "UNIT_MISMATCH":
      return { itemCode: `단위 불일치: ${err.message}` };
    case "VALIDATION_ERROR":
      return { global: "입력값이 유효하지 않습니다." };
    default:
      return { global: err.message };
  }
}

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function NewActivityPage() {
  const { items, loading: itemsLoading, error: itemsError } = useItems();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [listTick, setListTick] = useState(0);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      categoryCode: "",
      itemCode: "",
      occurredAt: "",
      amount: "",
      memo: "",
    },
  });

  // SSR과 client에서 todayISO() 결과(timezone)가 달라지는 hydration mismatch 방지.
  // 빈 값으로 SSR → client mount 후 setValue로 채운다.
  useEffect(() => {
    setValue("occurredAt", todayISO());
  }, [setValue]);

  const selectedCategory = useWatch({ control, name: "categoryCode" });
  const selectedItemCode = useWatch({ control, name: "itemCode" });

  const categories = useMemo(() => {
    const map = new Map<string, { code: string; name: string; scope: number }>();
    for (const item of items) {
      if (!map.has(item.categoryCode)) {
        map.set(item.categoryCode, {
          code: item.categoryCode,
          name: item.categoryName,
          scope: item.scope,
        });
      }
    }
    return Array.from(map.values());
  }, [items]);

  const filteredItems = useMemo<ItemOption[]>(() => {
    if (!selectedCategory) return items;
    return items.filter(
      (item) => item.categoryCode === selectedCategory
    );
  }, [items, selectedCategory]);

  const selectedItem = items.find((item) => item.code === selectedItemCode);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSuccess(null);
    try {
      const item = items.find((row) => row.code === values.itemCode);
      if (!item) {
        setError("itemCode", { message: "유효한 품목이 아닙니다" });
        return;
      }
      const res = await createActivity({
        itemCode: values.itemCode,
        occurredAt: values.occurredAt,
        amount: Number(values.amount),
        unit: item.unit,
        memo: values.memo || undefined,
      });
      setSuccess(
        `등록 완료 — #${res.id} ${item.name} ${res.amount} ${res.unit}`
      );
      setListTick((t) => t + 1);
      reset({
        categoryCode: values.categoryCode,
        itemCode: "",
        occurredAt: values.occurredAt,
        amount: "",
        memo: "",
      });
    } catch (unknownError) {
      if (unknownError instanceof ApiError) {
        const mapped = mapApiError(unknownError);
        if (mapped.itemCode) setError("itemCode", { message: mapped.itemCode });
        if (mapped.amount) setError("amount", { message: mapped.amount });
        if (mapped.occurredAt)
          setError("occurredAt", { message: mapped.occurredAt });
        if (mapped.global) setServerError(mapped.global);
      } else {
        setServerError(
          unknownError instanceof Error ? unknownError.message : "요청 실패"
        );
      }
    }
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 md:p-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          활동 데이터 입력
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          품목·발생일·수량을 입력하면 적절한 배출계수 버전이 자동으로 매칭됩니다.
        </p>
      </header>

      {itemsError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          품목 마스터 로드 실패: {itemsError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>새 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <FormField label="카테고리" hint="선택 시 품목 목록을 좁혀줍니다">
              <Controller
                control={control}
                name="categoryCode"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(raw: string | null) =>
                      field.onChange(raw ?? "")
                    }
                  >
                    <SelectTrigger className="w-full" disabled={itemsLoading}>
                      <SelectValue placeholder="전체">
                        {(selectedCode: string | null) =>
                          selectedCode
                            ? (CATEGORY_LABEL[selectedCode] ??
                              categories.find(
                                (cat) => cat.code === selectedCode
                              )?.name ??
                              selectedCode)
                            : "전체"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.code} value={category.code}>
                          {`${CATEGORY_LABEL[category.code] ?? category.name} · ${SCOPE_LABEL[category.scope] ?? `Scope ${category.scope}`}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label="품목"
              required
              error={errors.itemCode?.message}
              hint={
                selectedItem
                  ? `단위: ${selectedItem.unit}`
                  : "활동량의 단위가 자동 결정됩니다"
              }
            >
              <Controller
                control={control}
                name="itemCode"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(raw: string | null) =>
                      field.onChange(raw ?? "")
                    }
                  >
                    <SelectTrigger className="w-full" disabled={itemsLoading}>
                      <SelectValue placeholder="품목 선택">
                        {(selectedCode: string | null) =>
                          selectedCode
                            ? (items.find((item) => item.code === selectedCode)
                                ?.name ?? selectedCode)
                            : "품목 선택"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredItems.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {`${item.name} · ${item.unit}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label="발생일"
              required
              htmlFor="occurredAt"
              error={errors.occurredAt?.message}
            >
              <Input
                id="occurredAt"
                type="date"
                {...register("occurredAt")}
              />
            </FormField>

            <FormField
              label={selectedItem ? `수량 (${selectedItem.unit})` : "수량"}
              required
              htmlFor="amount"
              error={errors.amount?.message}
            >
              <Input
                id="amount"
                type="number"
                step="any"
                min="0"
                placeholder="예: 1500"
                {...register("amount")}
              />
            </FormField>

            <FormField
              label="메모"
              htmlFor="memo"
              className="md:col-span-2"
              hint="(선택) 출처·근거 등을 자유롭게 기록"
            >
              <Textarea id="memo" rows={3} {...register("memo")} />
            </FormField>

            {serverError && (
              <div className="md:col-span-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}
            {success && (
              <div className="md:col-span-2 rounded-md border border-emerald-500/30 bg-emerald-50/60 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                {success}
              </div>
            )}

            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setServerError(null);
                  setSuccess(null);
                }}
                disabled={isSubmitting}
              >
                초기화
              </Button>
              <Button type="submit" disabled={isSubmitting || itemsLoading}>
                {isSubmitting ? "저장 중…" : "저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <RecentActivitiesCard reloadKey={listTick} />
    </main>
  );
}
