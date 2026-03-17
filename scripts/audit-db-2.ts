import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Check shift teams
  console.log("--- SHIFT TEAMS ---");
  const teams = await prisma.consultantShiftTeam.findMany({ take: 20 });
  console.log(`  Total: ${teams.length}`);
  for (const t of teams) console.log(`  [${t.shift_team_id}] order=${t.team_order} name=${t.team_name} uni=${t.university_id}`);

  // Check borrow request #2
  console.log("\n--- BORROW REQUEST #2 ---");
  const br = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: 2 },
  });
  console.log(`  ${JSON.stringify(br, null, 2)}`);

  // Check consultants with shift team
  console.log("\n--- CONSULTANTS WITH SHIFT TEAM (sample) ---");
  const withTeam = await prisma.consultant.count({ where: { shift_team_id: { not: null } } });
  const withoutTeam = await prisma.consultant.count({ where: { shift_team_id: null } });
  console.log(`  With shift_team_id: ${withTeam}`);
  console.log(`  Without shift_team_id: ${withoutTeam}`);

  // Check account_role field
  console.log("\n--- ACCOUNT ROLE FIELD CHECK ---");
  const rawRoles = await prisma.$queryRawUnsafe(
    `SELECT account_role, COUNT(*) as cnt FROM account GROUP BY account_role ORDER BY cnt DESC LIMIT 10`
  ) as any[];
  for (const r of rawRoles) console.log(`  ${JSON.stringify(r)}`);

  // Check consultants from other universities (the main query)
  console.log("\n--- CONSULTANT COUNT BY UNIVERSITY (not uni #2's from_uni) ---");
  // First find the from_university_id of borrow request #2
  if (br) {
    const fromUniId = br.from_university_id;
    console.log(`  from_university_id: ${fromUniId}`);
    
    const otherConsultants = await prisma.consultant.count({
      where: { university_id: { not: fromUniId } },
    });
    console.log(`  Consultants not from uni ${fromUniId}: ${otherConsultants}`);

    // Check with the HEAD_CONSULTANT filter
    const nonHeadConsultants = await prisma.consultant.count({
      where: {
        university_id: { not: fromUniId },
        account: { account_role: { not: "HEAD_CONSULTANT" } },
      },
    });
    console.log(`  After HEAD_CONSULTANT filter: ${nonHeadConsultants}`);
  }

  // Check consultant profiles
  console.log("\n--- CONSULTANT PROFILE CHECK ---");
  const withProfile = await prisma.consultant.count({
    where: { profile: { isNot: null } },
  });
  const withoutProfile = await prisma.consultant.count({
    where: { profile: null },
  });
  console.log(`  With profile: ${withProfile}`);
  console.log(`  Without profile: ${withoutProfile}`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
