
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "dean_cu_eng";
  console.log(`🔍 Debugging login for: ${username}`);

  try {
    // 1. Fetch Account
    const account = await prisma.account.findUnique({
      where: { account_username: username },
      include: {
        universityAccesses: true,
        consultant: true,
        student: true,
      }
    });

    if (!account) {
      console.error("❌ Account not found");
      return;
    }
    console.log("✅ Account found:", {
      id: account.account_id,
      role: account.account_role,
      homeUni: account.account_home_university_id,
      accesses: account.universityAccesses
    });

    // 2. Accesses
    const grantedUniversityIds = account.universityAccesses.map((x) => x.university_id);
    console.log("✅ Granted IDs:", grantedUniversityIds);

    const homeUniversityId = account.account_home_university_id;
    const allowedUniversityIds = Array.from(
      new Set(
        [
          ...(homeUniversityId ? [homeUniversityId] : []),
          ...grantedUniversityIds,
        ].filter(Boolean)
      )
    ).sort((a, b) => a - b);
    
    console.log("✅ Allowed IDs:", allowedUniversityIds);

    // 3. Password Verify
    // "wellness@nu.ac.th_123456!"
    const isMatch = await bcrypt.compare("wellness@nu.ac.th_123456!", account.account_password);
    console.log("✅ Password Match:", isMatch);

    // 4. Test Token Generation (Mocking logic from jwt.ts to avoid alias issues)
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode("change-this-secret");
    
    // Payload from route.ts
    const payload = {
      accountId: account.account_id,
      username: account.account_username,
      role: account.account_role,
      homeUniversityId: account.account_home_university_id ?? undefined,
      activeUniversityId: allowedUniversityIds[0], // Mock active
      allowedUniversityIds: allowedUniversityIds,
      ver: 1,
    };
    
    console.log("🔍 Payload:", payload);

    const token = await new SignJWT(payload as any)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);
      
    console.log("✅ Token Generated:", token.slice(0, 20) + "...");

  } catch (error) {
    console.error("💥 CRASHED:", error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
