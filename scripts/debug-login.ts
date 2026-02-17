
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugLogin(username: string) {
  console.log(`🔍 Debugging login for ${username}...`);

  try {
    const account = await prisma.account.findUnique({
      where: { account_username: username },
      select: {
        account_id: true,
        account_username: true,
        account_password: true,
        account_role: true,
        account_home_university_id: true,

        consultant: {
          select: {
            consultant_id: true,
            university_id: true,
            profile: {
              select: {
                consultant_first_name: true,
                consultant_last_name: true,
              },
            },
          },
        },

        student: {
          select: {
            student_id: true,
            university_id: true,
          },
        },

        accessPermissions: {
          where: { access_revoked_at: null },
          select: { university_id: true },
          orderBy: { university_id: "asc" },
        },
      },
    });

    console.log("✅ Query success!");
    if (!account) {
      console.log("❌ Account not found (would return 401)");
    } else {
      console.log("✅ Account found:", account.account_username);
      console.log("   Permissions:", account.accessPermissions);
    }

  } catch (error) {
    console.error("❌ Query FAILED with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

const targetUser = process.argv[2] || "stu_nu_0001";
debugLogin(targetUser);
