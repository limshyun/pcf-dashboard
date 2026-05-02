"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
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
import { ApiError, type FactorRow, createFactor } from "@/lib/api-client";

const FactorFormSchema = z
  .object({
    itemCode: z.string().min(1, "품목을 선택하세요"),
    value: z
      .string()
      .min(1, "값을 입력하세요")
      .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, {
        message: "0보다 큰 숫자를 입력하세요",
      }),
    unit: z
      .string()
      .min(1, "단위를 입력하세요")
      .regex(
        /^[^/\s]+\s*\/\s*[^/\s]+$/,
        "예: kgCO2e/kWh"
      ),
    validFrom: z
      .string()
      .min(1, "유효 시작일을 입력하세요")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식"),
    validTo: z
      .string()
      .optional()
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), {
        message: "YYYY-MM-DD 형식",
      }),
    source: z.string().optional(),
    note: z.string().optional(),
  })
  .refine((v) => !v.validTo || v.validTo > v.validFrom, {
    message: "유효 종료일은 시작일보다 뒤여야 합니다",
    path: ["validTo"],
  });

type FactorFormValues = z.infer<typeof FactorFormSchema>;

interface Props {
  defaultItemCode?: string;
  onCreated?: (row: FactorRow) => void;
}

export function FactorCreateDialog({ defaultItemCode, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { items, loading: itemsLoading } = useItems();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FactorFormValues>({
    resolver: zodResolver(FactorFormSchema),
    defaultValues: {
      itemCode: defaultItemCode ?? "",
      value: "",
      unit: "",
      validFrom: "",
      validTo: "",
      source: "",
      note: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const row = await createFactor({
        itemCode: values.itemCode,
        value: Number(values.value),
        unit: values.unit.trim(),
        validFrom: values.validFrom,
        validTo: values.validTo ? values.validTo : null,
        source: values.source || undefined,
        note: values.note || undefined,
      });
      onCreated?.(row);
      reset({
        itemCode: values.itemCode,
        value: "",
        unit: values.unit,
        validFrom: "",
        validTo: "",
        source: values.source ?? "",
        note: "",
      });
      setOpen(false);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "UNKNOWN_ITEM") {
          setError("itemCode", { message: e.message });
        } else if (e.code === "VALIDATION_ERROR") {
          setServerError("입력값이 유효하지 않습니다.");
        } else {
          setServerError(e.message);
        }
      } else {
        setServerError(e instanceof Error ? e.message : "요청 실패");
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="default">새 버전 추가</Button>}
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>배출계수 새 버전</DialogTitle>
        </DialogHeader>
        <form className="grid grid-cols-1 gap-3" onSubmit={onSubmit}>
          <FormField label="품목" required error={errors.itemCode?.message}>
            <Controller
              control={control}
              name="itemCode"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v: string | null) => field.onChange(v ?? "")}
                >
                  <SelectTrigger className="w-full" disabled={itemsLoading}>
                    <SelectValue placeholder="품목 선택">
                      {(v: string | null) =>
                        v
                          ? (items.find((i) => i.code === v)?.name ?? v)
                          : "품목 선택"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((i) => (
                      <SelectItem key={i.code} value={i.code}>
                        {`${i.name} · ${i.categoryName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="값"
              required
              htmlFor="value"
              error={errors.value?.message}
            >
              <Input
                id="value"
                type="number"
                step="any"
                min="0"
                placeholder="예: 0.4781"
                {...register("value")}
              />
            </FormField>
            <FormField
              label="단위"
              required
              htmlFor="unit"
              error={errors.unit?.message}
              hint="배출량/활동량"
            >
              <Input
                id="unit"
                placeholder="예: kgCO2e/kWh"
                {...register("unit")}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="유효 시작일"
              required
              htmlFor="validFrom"
              error={errors.validFrom?.message}
            >
              <Input id="validFrom" type="date" {...register("validFrom")} />
            </FormField>
            <FormField
              label="유효 종료일"
              htmlFor="validTo"
              error={errors.validTo?.message}
              hint="비우면 현재 유효"
            >
              <Input id="validTo" type="date" {...register("validTo")} />
            </FormField>
          </div>

          <FormField label="출처" htmlFor="source">
            <Input
              id="source"
              placeholder="예: 한국전력 2024 환경성과보고서"
              {...register("source")}
            />
          </FormField>

          <FormField label="비고" htmlFor="note">
            <Textarea id="note" rows={2} {...register("note")} />
          </FormField>

          {serverError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
              {serverError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중…" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
