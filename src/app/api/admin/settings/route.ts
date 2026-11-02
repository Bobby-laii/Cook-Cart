import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";
import { z } from "zod";
import { APP_CONFIG } from "@/config/appConfig";

/**
 * Platform settings are financially and operationally sensitive:
 * - transaction_fee_percent changes what every customer is charged
 * - default_delivery_fee / free_delivery_threshold change checkout totals
 * - ai_monthly_spending_cap bounds real API spend
 * - system_prompt controls AI behaviour, including the food-only guardrail
 *
 * Both read and write therefore require the ADMIN role. Previously the POST
 * handler contained an empty authorization `if` block, which let anyone rewrite
 * these values.
 */

const settingsSchema = z.object({
  transaction_fee_percent: z.coerce.number().min(0).max(50).optional(),
  default_delivery_fee: z.coerce.number().min(0).max(500).optional(),
  free_delivery_threshold: z.coerce.number().min(0).max(100000).optional(),
  ai_model_name: z.string().trim().min(1).max(100).optional(),
  ai_monthly_spending_cap: z.coerce.number().min(0).max(1000000).optional(),
  system_prompt: z.string().trim().min(1).max(20000).optional(),
});

// Keys the client is allowed to persist, mapped to their validation field.
const ALLOWED_KEYS = [
  "transaction_fee_percent",
  "default_delivery_fee",
  "free_delivery_threshold",
  "ai_model_name",
  "ai_monthly_spending_cap",
  "system_prompt",
] as const;

export async function GET() {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const settings = await prisma.appSetting.findMany();
    const settingsMap: Record<string, string> = {};

    // Start from configured defaults so the admin UI is never blank.
    settingsMap.transaction_fee_percent = String(APP_CONFIG.fees.transactionFeePercent);
    settingsMap.default_delivery_fee = String(APP_CONFIG.fees.defaultDeliveryFee);
    settingsMap.free_delivery_threshold = String(APP_CONFIG.fees.freeDeliveryThreshold);
    settingsMap.ai_monthly_spending_cap = String(APP_CONFIG.ai.monthlySpendingCapHkd);
    settingsMap.ai_model_name = APP_CONFIG.ai.defaultModel;

    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid settings payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    let updatedCount = 0;

    for (const key of ALLOWED_KEYS) {
      const value = data[key];
      if (value === undefined) continue;

      await prisma.appSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
      updatedCount += 1;
    }

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      updatedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
