import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const query = `
    EXPLAIN ANALYZE WITH top_student AS (
      SELECT
        b.university_id,
        b.student_id,
        COUNT(*) AS total_bookings
      FROM booking b
      WHERE b.booking_status = 'COMPLETED'
      GROUP BY b.university_id, b.student_id
      ORDER BY total_bookings DESC
      LIMIT 1
    )
    SELECT
      sp.student_first_name_th,
      sp.student_last_name_th,
      u.university_name_th,
      COALESCE(f.faculty_name_th, 'ไม่ระบุคณะ') AS faculty_name_th,
      r.region_name_th,
      ts.total_bookings
    FROM top_student ts
    JOIN student s
      ON s.university_id = ts.university_id
     AND s.student_id     = ts.student_id
    JOIN student_profile sp
      ON sp.university_id = s.university_id
     AND sp.student_id     = s.student_id
    LEFT JOIN student_academic sa
      ON sa.university_id = s.university_id
     AND sa.student_id     = s.student_id
    LEFT JOIN faculty f
      ON f.university_id = sa.university_id
     AND f.faculty_id     = sa.faculty_id
    JOIN university u
      ON u.university_id = s.university_id
    JOIN province pv
      ON pv.province_id = u.province_id
    JOIN region r
      ON r.region_id = pv.region_id;
  `;

  try {
    const result = await prisma.$queryRawUnsafe(query);
    console.log(result);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
