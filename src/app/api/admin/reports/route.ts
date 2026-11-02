import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";

/**
 * Admin analytics: GMV, fee revenue, AI spend, and per-user AI usage logs
 * (which include customer emails). This must be ADMIN-only — previously the
 * handler had no session check at all.
 */
export async function GET() {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const orders = await prisma.order.findMany({
      include: { items: true, store: true },
    });

    const totalOrders = orders.length;
    const totalTransactionRevenue = orders.reduce((acc, o) => acc + o.transactionFee, 0);
    const totalDeliveryRevenue = orders.reduce((acc, o) => acc + o.deliveryFee, 0);
    const totalGrossRevenue = totalTransactionRevenue + totalDeliveryRevenue;

    const totalBasketAmounts = orders.reduce((acc, o) => acc + o.subtotal, 0);
    const avgBasketSize = totalOrders > 0 ? totalBasketAmounts / totalOrders : 0;

    // AI usage logs. Email is masked: admins need to identify abusive accounts,
    // not to harvest a contactable customer list.
    const aiLogs = await prisma.aIUsageLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    const maskedAiLogs = aiLogs.map((log) => ({
      ...log,
      user: log.user
        ? {
          ...log.user,
          email: maskEmail(log.user.email),
        }
        : null,
    }));

    // Aggregate over ALL logs, not just the 50 most recent rows shown in the UI.
    const aggregate = await prisma.aIUsageLog.aggregate({
      _sum: { tokensTotal: true, estimatedCostHkd: true },
      _count: { _all: true },
    });

    // Derived from real saved recipes rather than hardcoded sample numbers.
    const topCooked = await prisma.savedRecipe.groupBy({
      by: ["recipeId"],
      _count: { recipeId: true },
      orderBy: { _count: { recipeId: "desc" } },
      take: 5,
    });

    const recipeDetails = await prisma.recipe.findMany({
      where: { id: { in: topCooked.map((r) => r.recipeId) } },
      select: { id: true, title: true },
    });

    const topCookedRecipes = topCooked.map((row) => ({
      title:
        recipeDetails.find((r) => r.id === row.recipeId)?.title ?? "Unknown recipe",
      cooksCount: row._count.recipeId,
    }));

    const cuisineRows = await prisma.chatConversation.groupBy({
      by: ["cuisine"],
      _count: { cuisine: true },
      orderBy: { _count: { cuisine: "desc" } },
      take: 5,
    });

    const totalCuisineConvos = cuisineRows.reduce((acc, r) => acc + r._count.cuisine, 0);

    const topCuisines = cuisineRows
      .filter((r) => r.cuisine)
      .map((r) => ({
        cuisine: r.cuisine as string,
        requests: r._count.cuisine,
        percentage:
          totalCuisineConvos > 0
            ? `${Math.round((r._count.cuisine / totalCuisineConvos) * 100)}%`
            : "0%",
      }));

    return NextResponse.json({
      metrics: {
        totalOrders,
        totalTransactionRevenue: Math.round(totalTransactionRevenue * 10) / 10,
        totalDeliveryRevenue: Math.round(totalDeliveryRevenue * 10) / 10,
        totalGrossRevenue: Math.round(totalGrossRevenue * 10) / 10,
        avgBasketSize: Math.round(avgBasketSize * 10) / 10,
        totalAITokens: aggregate._sum.tokensTotal ?? 0,
        totalAICostHkd: Math.round((aggregate._sum.estimatedCostHkd ?? 0) * 100) / 100,
        totalConversations: aggregate._count._all,
      },
      topCuisines,
      topCookedRecipes,
      aiLogs: maskedAiLogs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 2))}@${domain}`;
}
