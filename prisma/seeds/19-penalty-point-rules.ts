// prisma/seeds/19-penalty-point-rules.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedPenaltyPointRules() {
  const rules = [
    {
      point_rule_code: "LATE_CANCEL_PENALTY",
      point_rule_name_th: "โทษยกเลิกการจองกะทันหัน",
      point_rule_points: 20, // applied as -20 in txn
      point_rule_is_active: true,
    },
    {
      point_rule_code: "NO_SHOW_PENALTY",
      point_rule_name_th: "โทษไม่มาตามนิสิตนัด",
      point_rule_points: 30, // applied as -30 in txn
      point_rule_is_active: true,
    },
    {
      point_rule_code: "EXCEPTION_REFUND",
      point_rule_name_th: "คืนแต้มจากการอนุมัติยกเว้นโทษ",
      point_rule_points: 0, // amount set dynamically at transaction time
      point_rule_is_active: true,
    },
  ];

  for (const rule of rules) {
    await prisma.pointRule.upsert({
      where: { point_rule_code: rule.point_rule_code },
      update: {
        point_rule_name_th: rule.point_rule_name_th,
        point_rule_is_active: rule.point_rule_is_active,
      },
      create: rule,
    });
  }

  console.log("✅ [Seed] Penalty PointRules upserted");
}

// Allow running standalone
if (require.main === module) {
  seedPenaltyPointRules()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
