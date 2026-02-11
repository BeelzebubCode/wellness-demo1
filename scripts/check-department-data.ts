import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log("Checking Engineering Faculty (likely ID 1, 2, or 3)...");

        // Find Faculty of Engineering
        const faculty = await prisma.faculty.findFirst({
            where: { faculty_name_en: { contains: "Engineering" } }
        });

        if (!faculty) {
            console.log("Faculty of Engineering not found. Listing all faculties:");
            const faculties = await prisma.faculty.findMany({ select: { faculty_id: true, faculty_name_en: true } });
            console.table(faculties);
            return;
        }

        console.log(`Found Faculty: ${faculty.faculty_name_th} (${faculty.faculty_name_en}) ID: ${faculty.faculty_id}`);

        // Run the query from DeanService
        const stats = await prisma.$queryRaw`
        SELECT 
            d.department_id,
            d.department_code,
            d.department_name_th,
            (
                SELECT COUNT(*)::int
                FROM "student_academic" sa
                WHERE sa.department_id = d.department_id AND sa.university_id = ${faculty.university_id}
            ) as student_count,
            (
                SELECT COUNT(*)::int
                FROM "booking" b
                JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
                WHERE sa.department_id = d.department_id AND b.university_id = ${faculty.university_id}
            ) as booking_count
        FROM "department" d
        WHERE d.faculty_id = ${faculty.faculty_id} AND d.university_id = ${faculty.university_id}
    `;

        console.table(stats);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
