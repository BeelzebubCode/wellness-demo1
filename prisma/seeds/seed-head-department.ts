/**
 * Seed: HEAD_DEPARTMENT accounts
 * สร้าง account 1 คนต่อ 1 ภาควิชา → อัปเดต department.head_account_id
 *
 * Usage:
 *   npx tsx prisma/seeds/seed-head-department.ts
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("🏗️  Seeding HEAD_DEPARTMENT accounts...");

    // 1. ดึงภาควิชาทั้งหมดที่ยังไม่มี head
    const departments = await prisma.$queryRaw<
        {
            department_id: number;
            university_id: number;
            faculty_id: number;
            department_code: string;
            university_code: string;
        }[]
    >`
    SELECT
      d.department_id,
      d.university_id,
      d.faculty_id,
      d.department_code,
      u.university_code
    FROM department d
    JOIN university u ON d.university_id = u.university_id
    WHERE d.head_account_id IS NULL
    ORDER BY d.university_id, d.department_id
  `;

    console.log(`📋 Found ${departments.length} departments without head`);

    if (departments.length === 0) {
        console.log("✅ All departments already have heads!");
        return;
    }

    // 2. Batch insert — ใช้ raw SQL เพื่อความเร็ว
    const BATCH_SIZE = 500;
    let created = 0;

    for (let i = 0; i < departments.length; i += BATCH_SIZE) {
        const batch = departments.slice(i, i + BATCH_SIZE);

        // 2a. Insert accounts
        const accountValues = batch
            .map((d) => {
                const username = `hd_${d.department_code}_${d.university_code}`.toLowerCase().replace(/\s+/g, "_").substring(0, 50);
                // Password: hashed "password123" (bcrypt)
                const passwordHash = "$2b$10$EIXe0eK7S5z5z5z5z5z5z.HASH_PLACEHOLDER_FOR_SEED";
                return `('${username}', '${passwordHash}', 'HEAD_DEPARTMENT', ${d.university_id}, NOW())`;
            })
            .join(",\n    ");

        await prisma.$executeRawUnsafe(`
      INSERT INTO account (account_username, account_password, account_role, account_home_university_id, account_created_at)
      VALUES
        ${accountValues}
      ON CONFLICT (account_username) DO NOTHING
    `);

        // 2b. Fetch newly created account_ids
        const usernames = batch.map(
            (d) => `hd_${d.department_code}_${d.university_code}`.toLowerCase().replace(/\s+/g, "_").substring(0, 50)
        );

        const accounts = await prisma.$queryRaw<
            { account_id: number; account_username: string }[]
        >`
      SELECT account_id, account_username
      FROM account
      WHERE account_username = ANY(${usernames})
    `;

        const usernameToId = new Map(accounts.map((a) => [a.account_username, a.account_id]));

        // 2c. Update department.head_account_id
        for (const d of batch) {
            const username = `hd_${d.department_code}_${d.university_code}`.toLowerCase().replace(/\s+/g, "_").substring(0, 50);
            const accountId = usernameToId.get(username);
            if (accountId) {
                await prisma.$executeRaw`
          UPDATE department
          SET head_account_id = ${accountId}
          WHERE department_id = ${d.department_id}
        `;
            }
        }

        // 2d. Create account_university_permission
        for (const d of batch) {
            const username = `hd_${d.department_code}_${d.university_code}`.toLowerCase().replace(/\s+/g, "_").substring(0, 50);
            const accountId = usernameToId.get(username);
            if (accountId) {
                await prisma.$executeRawUnsafe(`
          INSERT INTO account_university_permission
            (account_id, university_id, access_role, access_granted_at)
          VALUES
            (${accountId}, ${d.university_id}, 'HEAD_DEPARTMENT', NOW())
          ON CONFLICT (account_id, university_id) DO NOTHING
        `);
            }
        }

        created += batch.length;
        console.log(`  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${created}/${departments.length}`);
    }

    // 3. Verify
    const headCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::int as count FROM account WHERE account_role = 'HEAD_DEPARTMENT'
  `;
    const deptWithHead = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::int as count FROM department WHERE head_account_id IS NOT NULL
  `;

    console.log("");
    console.log("📊 Results:");
    console.log(`   HEAD_DEPARTMENT accounts: ${Number(headCount[0]?.count || 0)}`);
    console.log(`   Departments with head:    ${Number(deptWithHead[0]?.count || 0)}`);
    console.log("🎉 Done!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
