
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const totalBookings = await prisma.booking.count();
  console.log(`Total Bookings in DB: ${totalBookings.toLocaleString()}`);

  const activeUnis = await prisma.university.findMany({
    where: { university_is_active: true },
    select: { university_id: true, university_latitude: true, university_longitude: true }
  });
  
  const activeUniIds = activeUnis.map(u => u.university_id);
  const activeBookings = await prisma.booking.count({
    where: { university_id: { in: activeUniIds } }
  });
  console.log(`Bookings for Active Universities: ${activeBookings.toLocaleString()}`);

  const unisWithCoords = activeUnis.filter(u => u.university_latitude !== null && u.university_longitude !== null);
  const uniIdsWithCoords = unisWithCoords.map(u => u.university_id);
  const bookingsOnMap = await prisma.booking.count({
    where: { university_id: { in: uniIdsWithCoords } }
  });
  console.log(`Bookings for Active Unis with Coordinates (On Map): ${bookingsOnMap.toLocaleString()}`);

  // Get Top Universities to see if data is concentrated
  const uniStats = await prisma.booking.groupBy({
    by: ['university_id'],
    _count: { university_id: true },
  });
  
  // Sort in JS to avoid Prisma version compatibility issues with orderBy on aggregates
  const sortedStats = uniStats.sort((a, b) => (b._count.university_id - a._count.university_id)).slice(0, 10);

  console.log("\nTop 10 Universities by Booking Count in DB:");
  for (const item of sortedStats) {
    const uni = await prisma.university.findUnique({
      where: { university_id: item.university_id },
      select: { university_code: true, university_name_th: true, university_is_active: true, university_latitude: true }
    });
    console.log(`- ${uni?.university_name_th || 'Unknown'} (${uni?.university_code}): ${item._count.university_id.toLocaleString()} (Active: ${uni?.university_is_active}, HasCoords: ${!!uni?.university_latitude})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
