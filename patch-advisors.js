
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🩹 Patching Student Advisors...");

    // 1. Get all advisors
    const advisors = await prisma.advisor.findMany();
    console.log(`👨‍🏫 Found ${advisors.length} advisors available.`);

    if (advisors.length === 0) {
        console.error("❌ No advisors found in DB. Cannot patch.");
        return;
    }

    // 2. Get students without advisor
    // We need to fetch in chunks to avoid memory issues if there are many
    const CHUNK_SIZE = 1000;
    let updatedCount = 0;

    while (true) {
        const students = await prisma.studentAcademic.findMany({
            where: { advisor_id: null },
            take: CHUNK_SIZE,
            include: {
                department: true,
                faculty: true // Fallback
            }
        });

        if (students.length === 0) break;

        console.log(`Processing batch of ${students.length} students...`);

        const updates = [];

        for (const st of students) {
            // Find matching advisor
            let advisor = advisors.find(a =>
                a.university_id === st.university_id &&
                a.department_id === st.department_id
            );

            // Fallback to faculty
            if (!advisor) {
                advisor = advisors.find(a =>
                    a.university_id === st.university_id &&
                    a.faculty_id === st.faculty_id
                );
            }

            // Fallback to any in uni?
            if (!advisor) {
                advisor = advisors.find(a => a.university_id === st.university_id);
            }

            if (advisor) {
                updates.push(
                    prisma.studentAcademic.update({
                        where: { student_id: st.student_id }, // composite key in schema is university_id, student_id? 
                        // Wait, schema says @@unique([university_id, student_id]) and student_id is @id?
                        // Let's check schema.
                        // model StudentAcademic { student_id Int @id ... }
                        // So student_id is PK.
                        data: { advisor_id: advisor.advisor_id }
                    })
                );
            }
        }

        if (updates.length > 0) {
            await prisma.$transaction(updates);
            updatedCount += updates.length;
            process.stdout.write(`.`);
        }
    }

    console.log(`\n✅ Successfully patched ${updatedCount} students.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
