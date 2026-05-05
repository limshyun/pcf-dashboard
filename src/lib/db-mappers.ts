import type {
  Activity,
  ActivityCategory,
  ActivityItem,
  EmissionFactor,
} from "@prisma/client";

import type {
  ActivityInput,
  EmissionFactorInput,
} from "@/domain/pcf-calculator";

export type ActivityWithRelations = Activity & {
  item: ActivityItem & { category: ActivityCategory };
};

type EmissionFactorWithItem = EmissionFactor & {
  item: ActivityItem;
};

export function toActivityInput(a: ActivityWithRelations): ActivityInput {
  return {
    occurredAt: a.occurredAt,
    amount: a.amount.toString(),
    unit: a.unit,
    item: {
      code: a.item.code,
      unit: a.item.unit,
      category: {
        code: a.item.category.code,
        scope: a.item.category.scope,
      },
    },
  };
}

export function toFactorInput(f: EmissionFactorWithItem): EmissionFactorInput {
  return {
    itemCode: f.item.code,
    value: f.value.toString(),
    unit: f.unit,
    version: f.version,
    validFrom: f.validFrom,
    validTo: f.validTo,
  };
}
