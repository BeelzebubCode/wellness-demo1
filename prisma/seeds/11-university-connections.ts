// prisma/seeds/11-university-connections.ts
/**
 * Seed university connections - Top 10 nearest universities
 */

import { PrismaClient } from "@prisma/client";

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function seedUniversityConnections(prisma: PrismaClient) {
  console.log("🔗 Seeding university connections (Top 10 nearest)...");

  // Fetch all universities with coordinates
  const universities = await prisma.university.findMany({
    where: {
      university_is_active: true,
      AND: [
        { university_latitude: { not: null } },
        { university_longitude: { not: null } },
      ],
    },
    select: {
      university_id: true,
      university_code: true,
      university_name_th: true,
      university_latitude: true,
      university_longitude: true,
    },
  });

  console.log(`  Found ${universities.length} active universities with coordinates`);

  let totalCreated = 0;

  for (const sourceUni of universities) {
    const sourceLat = Number(sourceUni.university_latitude);
    const sourceLng = Number(sourceUni.university_longitude);

    // Calculate distances to all other universities
    const distances = universities
      .filter((uni) => uni.university_id !== sourceUni.university_id)
      .map((targetUni) => ({
        targetUni,
        distance: calculateDistance(
          sourceLat,
          sourceLng,
          Number(targetUni.university_latitude),
          Number(targetUni.university_longitude)
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // ✅ Top 10 nearest

    // Create connections
    for (let i = 0; i < distances.length; i++) {
      const { targetUni, distance } = distances[i];

      await prisma.universityConnection.upsert({
        where: {
          source_university_id_target_university_id: {
            source_university_id: sourceUni.university_id,
            target_university_id: targetUni.university_id,
          },
        },
        update: {
          distance_km: distance,
          connection_rank: i + 1,
        },
        create: {
          source_university_id: sourceUni.university_id,
          target_university_id: targetUni.university_id,
          distance_km: distance,
          connection_rank: i + 1,
        },
      });

      totalCreated++;
    }
  }

  console.log(`  ✅ Created/updated ${totalCreated} connections`);
  console.log(`  📊 Average ${Math.round(totalCreated / universities.length)} connections per university`);
}
