
import { PrismaClient } from "@prisma/client";
import { universitiesGeoJSON } from "../seed-data/universities-geojson-data";

export async function seedManualConnections(prisma: PrismaClient) {
  console.log("🔗 Seeding manual connections from GeoJSON...");

  // 1. Extract Edges from GeoJSON
  const edgeFeatures = universitiesGeoJSON.features.filter(
    (f) => f.properties.feature_type === "edge"
  );

  console.log(`   Found ${edgeFeatures.length} manual edges in GeoJSON.`);
  if (edgeFeatures.length === 0) return;

  // 2. Resolve University IDs from Names
  // Collect all unique names to query once
  const universityNames = new Set<string>();
  edgeFeatures.forEach((f) => {
    if (f.properties.source) universityNames.add(f.properties.source);
    if (f.properties.target) universityNames.add(f.properties.target);
  });

  const universities = await prisma.university.findMany({
    where: {
      OR: [
        { university_name_en: { in: Array.from(universityNames) } },
        { university_name_th: { in: Array.from(universityNames) } },
      ],
    },
    select: {
      university_id: true,
      university_name_en: true,
      university_name_th: true,
    },
  });

  // Map Name -> ID
  const uniIdMap = new Map<string, number>();
  for (const u of universities) {
    if (u.university_name_en) uniIdMap.set(u.university_name_en, u.university_id);
    if (u.university_name_th) uniIdMap.set(u.university_name_th, u.university_id);
  }

  let createdCount = 0;
  let skippedCount = 0;

  // 3. Upsert Connections
  for (const f of edgeFeatures) {
    const p = f.properties;
    const sourceName = p.source;
    const targetName = p.target;
    const distanceKm = p.distance_km || 0;
    const rank = p.rank || 99; // Default rank if missing

    if (typeof sourceName !== "string" || typeof targetName !== "string") {
      continue;
    }

    const sourceId = uniIdMap.get(sourceName);
    const targetId = uniIdMap.get(targetName);

    if (!sourceId || !targetId) {
      // console.warn(`   ⚠️  Skip edge: ${sourceName} -> ${targetName} (ID not found)`);
      skippedCount++;
      continue;
    }

    // Upsert connection
    await prisma.universityConnection.upsert({
      where: {
        source_university_id_target_university_id: {
          source_university_id: sourceId,
          target_university_id: targetId,
        },
      },
      update: {
        distance_km: distanceKm,
        connection_rank: rank,
      },
      create: {
        source_university_id: sourceId,
        target_university_id: targetId,
        distance_km: distanceKm,
        connection_rank: rank,
      },
    });
    createdCount++;
  }

  console.log(`   ✅ Manual connections: Created/Updated ${createdCount}, Skipped ${skippedCount}`);
}
