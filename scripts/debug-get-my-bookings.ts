
import { PrismaClient } from "@prisma/client";
import { getMyBookings } from "../src/services/booking/handlers/getMyBookings";

// Mock the prisma import in the handler or just rely on the real one if it imports from @/lib/prisma
// Since we are running with tsx, it should resolve @/lib/prisma if configured, 
// but tsx might not handle path aliases by default without tsconfig-paths.
// A safer bet is to copy the logic or ensure tsconfig-paths is setup.
// For now, let's just try to call the handler. If alias fails, we'll fix it.

// Actually, calling the service function directly is better.
// But we need to make sure the service uses the SAME prisma client or a valid one.
// The service imports `prisma` from `@/lib/prisma`.

async function run() {
  console.log("🔍 Debugging getMyBookings...");

  try {
      // simulate a student
      const result = await getMyBookings({
          accountId: 2, // Check DB for a valid student account ID
          activeUniversityId: 1, // Check DB
          role: "STUDENT",
          limit: 5,
          statusGroup: "ACTIVE"
      });

      console.log("✅ getMyBookings success!");
      console.log(`   Found ${result.items.length} items.`);
      console.log(JSON.stringify(result.items.slice(0, 1), null, 2));

  } catch (error) {
      console.error("❌ getMyBookings FAILED:", error);
  }
}

run();
