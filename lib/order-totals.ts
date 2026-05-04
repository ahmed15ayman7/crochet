import { prisma } from "@/lib/prisma";

export async function resolveProductsForOrder(productIds: string[]): Promise<
  | { ok: true; totalAmount: number; uniqueIds: string[] }
  | { ok: false }
> {
  const uniqueIds = [...new Set(productIds)];
  const products = await prisma.product.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, price: true },
  });
  if (products.length !== uniqueIds.length) return { ok: false };
  const totalAmount = products.reduce((sum, p) => sum + p.price, 0);
  return { ok: true, totalAmount, uniqueIds };
}
