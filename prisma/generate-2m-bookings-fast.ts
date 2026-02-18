// Ultra-fast 2M booking generation using pure SQL
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Generating 2M bookings ULTRA FAST (SQL-only)...\n');

  // Enable turbo mode
  console.log('⚡ Enabling PostgreSQL turbo mode...');
  await prisma.$executeRawUnsafe(`SET synchronous_commit = OFF`);
  await prisma.$executeRawUnsafe(`SET work_mem = '1GB'`);
  await prisma.$executeRawUnsafe(`SET maintenance_work_mem = '1GB'`);
  console.log('   ✅ Turbo mode enabled\n');

  const COMPLETED = 1_700_000;
  const CANCELLED = 200_000;
  const PENDING = 100_000;

  console.log('📊 Plan:');
  console.log(`   ✅ COMPLETED: ${COMPLETED.toLocaleString()}`);
  console.log(`   ❌ CANCELLED: ${CANCELLED.toLocaleString()}`);
  console.log(`   ⏳ PENDING: ${PENDING.toLocaleString()}\n`);

  // COMPLETED bookings (1.7M) - with consultants
  console.log(`[1/3] Creating ${COMPLETED.toLocaleString()} COMPLETED bookings...`);
  const startCompleted = Date.now();
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking (
      university_id,
      student_id,
      consultant_id,
      time_slot_id,
      problem_category_id,
      online_channel_category_id,
      booking_detail_text,
      booking_service_mode,
      booking_status,
      booking_created_at
    )
    SELECT
      s.university_id,
      s.student_id,
      c.consultant_id,
      ts.time_slot_id,
      (SELECT problem_category_id FROM problem_category ORDER BY random() LIMIT 1),
      CASE 
        WHEN random() > 0.3 THEN (SELECT online_channel_category_id FROM online_channel_category ORDER BY random() LIMIT 1)
        ELSE NULL
      END,
      'นัดหมาย (Auto-generated)',
      CASE WHEN random() > 0.3 THEN 'ONLINE'::"ServiceMode" ELSE 'ONSITE'::"ServiceMode" END,
      'COMPLETED'::"BookingStatus",
      NOW() - (random() * interval '90 days')
    FROM (
      SELECT DISTINCT ON (student_id) 
        student_id, university_id 
      FROM student 
      ORDER BY student_id, random()
    ) s
    CROSS JOIN LATERAL (
      SELECT time_slot_id 
      FROM time_slot 
      WHERE time_slot.university_id = s.university_id 
        AND time_slot_status = 'OPEN'
      ORDER BY random() 
      LIMIT 1
    ) ts
    CROSS JOIN LATERAL (
      SELECT consultant_id 
      FROM consultant 
      WHERE consultant.university_id = s.university_id 
      ORDER BY random() 
      LIMIT 1
    ) c
    LIMIT ${COMPLETED}
    ON CONFLICT DO NOTHING;
  `);
  
  const completedTime = ((Date.now() - startCompleted) / 1000).toFixed(1);
  console.log(`   ✅ Done in ${completedTime}s\n`);

  // CANCELLED bookings (200K) - no consultants
  console.log(`[2/3] Creating ${CANCELLED.toLocaleString()} CANCELLED bookings...`);
  const startCancelled = Date.now();
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking (
      university_id,
      student_id,
      consultant_id,
      time_slot_id,
      problem_category_id,
      online_channel_category_id,
      booking_detail_text,
      booking_service_mode,
      booking_status,
      booking_created_at
    )
    SELECT
      s.university_id,
      s.student_id,
      NULL,
      ts.time_slot_id,
      (SELECT problem_category_id FROM problem_category ORDER BY random() LIMIT 1),
      CASE 
        WHEN random() > 0.3 THEN (SELECT online_channel_category_id FROM online_channel_category ORDER BY random() LIMIT 1)
        ELSE NULL
      END,
      'นัดหมาย (ยกเลิกแล้ว)',
      CASE WHEN random() > 0.3 THEN 'ONLINE'::"ServiceMode" ELSE 'ONSITE'::"ServiceMode" END,
      'CANCELLED'::"BookingStatus",
      NOW() - (random() * interval '90 days')
    FROM (
      SELECT student_id, university_id 
      FROM student 
      ORDER BY random()
      LIMIT ${CANCELLED}
    ) s
    CROSS JOIN LATERAL (
      SELECT time_slot_id 
      FROM time_slot 
      WHERE time_slot.university_id = s.university_id 
        AND time_slot_status = 'OPEN'
      ORDER BY random() 
      LIMIT 1
    ) ts
    ON CONFLICT DO NOTHING;
  `);
  
  const cancelledTime = ((Date.now() - startCancelled) / 1000).toFixed(1);
  console.log(`   ✅ Done in ${cancelledTime}s\n`);

  // PENDING bookings (100K) - no consultants
  console.log(`[3/3] Creating ${PENDING.toLocaleString()} PENDING bookings...`);
  const startPending = Date.now();
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking (
      university_id,
      student_id,
      consultant_id,
      time_slot_id,
      problem_category_id,
      online_channel_category_id,
      booking_detail_text,
      booking_service_mode,
      booking_status,
      booking_created_at
    )
    SELECT
      s.university_id,
      s.student_id,
      NULL,
      ts.time_slot_id,
      (SELECT problem_category_id FROM problem_category ORDER BY random() LIMIT 1),
      CASE 
        WHEN random() > 0.3 THEN (SELECT online_channel_category_id FROM online_channel_category ORDER BY random() LIMIT 1)
        ELSE NULL
      END,
      'รอการจัดเจ้าหน้าที่',
      CASE WHEN random() > 0.3 THEN 'ONLINE'::"ServiceMode" ELSE 'ONSITE'::"ServiceMode" END,
      'PENDING_ASSIGNMENT'::"BookingStatus",
      NOW() - (random() * interval '7 days')
    FROM (
      SELECT student_id, university_id 
      FROM student 
      ORDER BY random()
      LIMIT ${PENDING}
    ) s
    CROSS JOIN LATERAL (
      SELECT time_slot_id 
      FROM time_slot 
      WHERE time_slot.university_id = s.university_id 
        AND time_slot_status = 'OPEN'
      ORDER BY random() 
      LIMIT 1
    ) ts
    ON CONFLICT DO NOTHING;
  `);
  
  const pendingTime = ((Date.now() - startPending) / 1000).toFixed(1);
  console.log(`   ✅ Done in ${pendingTime}s\n`);

  // Verify
  const count = await prisma.booking.count();
  const totalTime = ((Date.now() - startCompleted) / 1000).toFixed(1);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Total: ${count.toLocaleString()} bookings created in ${totalTime}s`);
  console.log(`⚡ Speed: ${(count / parseFloat(totalTime)).toFixed(0).toLocaleString()} bookings/s`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
