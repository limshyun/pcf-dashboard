import { prisma } from "@/lib/prisma";

export async function listItems() {
  return prisma.activityItem.findMany({
    include: { category: true },
    orderBy: [{ category: { code: "asc" } }, { code: "asc" }],
  });
}
