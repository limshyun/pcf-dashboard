import { prisma } from "@/lib/prisma";

export async function listItems() {
  return prisma.activityItem.findMany({
    include: { category: true },
    orderBy: [{ category: { code: "asc" } }, { code: "asc" }],
  });
}

export async function listCategories() {
  return prisma.activityCategory.findMany({ orderBy: { code: "asc" } });
}
