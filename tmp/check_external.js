
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking for external therapist assignments...');

    const externalAssignments = await prisma.$queryRaw`
    SELECT 
      b.booking_id,
      b.university_id as booking_university,
      ba.consultant_university_id as consultant_university,
      ba.consultant_id
    FROM booking b
    JOIN booking_assignment ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    WHERE ba.is_active = true
      AND ba.consultant_university_id != b.university_id
      AND ba.consultant_university_id IS NOT NULL
    LIMIT 10;
  `;

    console.log('Found external assignments:', JSON.stringify(externalAssignments, null, 2));

    const totalCounts = await prisma.$queryRaw`
    SELECT 
      COUNT(CASE WHEN ba.consultant_university_id = b.university_id THEN 1 END) as internal,
      COUNT(CASE WHEN ba.consultant_university_id != b.university_id AND ba.consultant_university_id IS NOT NULL THEN 1 END) as external
    FROM booking b
    JOIN booking_assignment ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    WHERE ba.is_active = true;
  `;

    console.log('Total counts:', totalCounts);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
