import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Consultant Shift Teams...");

    const universities = await prisma.university.findMany({
        include: {
            consultants: true,
        },
    });

    let teamOperationsCount = 0;
    let consultantOperationsCount = 0;

    for (const uni of universities) {
        if (uni.consultants.length === 0) continue;

        const createdTeams: { [order: number]: number } = {};

        // 1. Create 4 teams per university
        for (let i = 1; i <= 4; i++) {
            const team = await prisma.consultantShiftTeam.upsert({
                where: {
                    university_id_team_name: {
                        university_id: uni.university_id,
                        team_name: `ทีม ${i}`
                    }
                },
                update: {
                    team_order: i,
                },
                create: {
                    university_id: uni.university_id,
                    team_name: `ทีม ${i}`,
                    team_order: i,
                }
            });
            createdTeams[i] = team.shift_team_id;
            teamOperationsCount++;
        }

        // 2. Distribute consultants in chunks of 5 per team
        for (let i = 0; i < uni.consultants.length; i++) {
            const consultant = uni.consultants[i];

            // chunk logic: index 0..4 -> team_order 1
            // index 5..9 -> team_order 2
            // index 10..14 -> team_order 3
            // index 15..19 -> team_order 4
            const teamOrder = Math.floor((i % 20) / 5) + 1;

            await prisma.consultant.update({
                where: { consultant_id: consultant.consultant_id },
                data: { shift_team_id: createdTeams[teamOrder] }
            });

            consultantOperationsCount++;
        }
    }

    console.log(`✅ Seeded ${teamOperationsCount} teams across universities.`);
    console.log(`✅ Assigned ${consultantOperationsCount} consultants to shift teams.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
