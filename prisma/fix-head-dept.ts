/**
 * Fix HEAD_DEPARTMENT password + re-seed
 * 
 * Usage: npx tsx prisma/fix-head-dept.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PLAIN_PASSWORD = "wellness@nu.ac.th_123456!";

async function main() {
  console.log("🔧 Fixing HEAD_DEPARTMENT accounts...\n");

  // 1. ลบ accounts เก่าที่ password ผิด
  console.log("🗑️  Cleaning old HEAD_DEPARTMENT data...");
  await prisma.$executeRawUnsafe(`DELETE FROM account_university_permission WHERE access_role = 'HEAD_DEPARTMENT'`);
  await prisma.$executeRawUnsafe(`UPDATE department SET head_account_id = NULL`);
  const deleted = await prisma.$executeRawUnsafe(`DELETE FROM account WHERE account_role = 'HEAD_DEPARTMENT'`);
  console.log(`   ✅ Deleted ${deleted} old accounts\n`);

  // 2. Hash password ที่ถูกต้อง
  const passwordHash = await bcrypt.hash(PLAIN_PASSWORD, 10);
  console.log(`🔑 Using password: ${PLAIN_PASSWORD}`);

  // 3. ดึงภาควิชาทั้งหมด
  const departments = await prisma.$queryRaw<
    { department_id: number; university_id: number; department_code: string; university_code: string }[]
  >`
    SELECT d.department_id, d.university_id, d.department_code, u.university_code
    FROM department d
    JOIN university u ON d.university_id = u.university_id
    ORDER BY d.university_id, d.department_id
  `;

  console.log(`📋 Found ${departments.length} departments\n`);

  if (departments.length === 0) {
    console.log("⚠️  No departments found!");
    return;
  }

  // 4. Batch insert accounts
  const BATCH = 500;
  let total = 0;

  for (let i = 0; i < departments.length; i += BATCH) {
    const batch = departments.slice(i, i + BATCH);

    const values = batch
      .map((d) => {
        const username = `hd_${d.department_code}_${d.university_code}`.toLowerCase().replace(/\s+/g, "_").substring(0, 50);
        return `('${username}', '${passwordHash}', 'HEAD_DEPARTMENT', ${d.university_id}, NOW())`;
      })
      .join(",\n    ");

    await prisma.$executeRawUnsafe(`
      INSERT INTO account (account_username, account_password, account_role, account_home_university_id, account_created_at)
      VALUES ${values}
      ON CONFLICT (account_username) DO UPDATE SET account_password = EXCLUDED.account_password
    `);

    // Fetch account IDs
    const usernames = batch.map(
      (d) => `hd_${d.department_code}_${d.university_code}`.toLowerCase().replace(/\s+/g, "_").substring(0, 50)
    );

    const accounts = await prisma.$queryRaw<
      { account_id: number; account_username: string }[]
    >`SELECT account_id, account_username FROM account WHERE account_username = ANY(${usernames})`;

    const usernameToId = new Map(accounts.map((a) => [a.account_username, a.account_id]));

    // Update department.head_account_id
    for (const d of batch) {
      const username = `hd_${d.department_code}_${d.university_code}`.toLowerCase().replace(/\s+/g, "_").substring(0, 50);
      const accountId = usernameToId.get(username);
      if (accountId) {
        await prisma.$executeRaw`UPDATE department SET head_account_id = ${accountId} WHERE department_id = ${d.department_id}`;
      }
    }

    // Create permissions
    for (const d of batch) {
      const username = `hd_${d.department_code}_${d.university_code}`.toLowerCase().replace(/\s+/g, "_").substring(0, 50);
      const accountId = usernameToId.get(username);
      if (accountId) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO account_university_permission (account_id, university_id, access_role, access_granted_at)
          VALUES (${accountId}, ${d.university_id}, 'HEAD_DEPARTMENT', NOW())
          ON CONFLICT (account_id, university_id) DO NOTHING
        `);
      }
    }

    total += batch.length;
    console.log(`   ✅ Batch ${Math.floor(i / BATCH) + 1}: ${total}/${departments.length}`);
  }

  // 5. Verify
  const headCount = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int as count FROM account WHERE account_role = 'HEAD_DEPARTMENT'
  `;
  const deptWithHead = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int as count FROM department WHERE head_account_id IS NOT NULL
  `;

  // Show some sample usernames
  const samples = await prisma.$queryRaw<{ account_username: string }[]>`
    SELECT account_username FROM account WHERE account_role = 'HEAD_DEPARTMENT' ORDER BY account_id LIMIT 10
  `;

  console.log("\n📊 Results:");
  console.log(`   HEAD_DEPARTMENT accounts: ${headCount[0]?.count || 0}`);
  console.log(`   Departments with head:    ${deptWithHead[0]?.count || 0}`);
  console.log(`\n🔑 Sample usernames (password: ${PLAIN_PASSWORD}):`);
  samples.forEach((s) => console.log(`   ${s.account_username}`));
  console.log("\n🎉 Done!");
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
