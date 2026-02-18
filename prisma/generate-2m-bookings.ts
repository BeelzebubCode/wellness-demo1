// Generate 2M bookings ONLY (no re-seeding)
import { PrismaClient, BookingStatus, ServiceMode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Generating 2M booking records...\n');

  // Fetch required data
  console.log('📚 Fetching data...');
  const students = await prisma.student.findMany({ select: { student_id: true, university_id: true } });
  const time_slots = await prisma.timeSlot.findMany({ 
    where: { time_slot_status: 'OPEN' },
    select: { time_slot_id: true, university_id: true, time_slot_start_datetime: true }
  });
  const consultants = await prisma.consultant.findMany({ select: { consultant_id: true, university_id: true } });
  const categories = await prisma.problemCategory.findMany({ select: { problem_category_id: true } });
  const channels = await prisma.onlineChannelCategory.findMany({ select: { online_channel_category_id: true } });

  console.log(`   Found: ${students.length.toLocaleString()} students, ${time_slots.length.toLocaleString()} slots\n`);

  // Booking distribution
  const TOTAL = 2_000_000;
  const COMPLETED = Math.floor(TOTAL * 0.85); // 1.7M
  const CANCELLED = Math.floor(TOTAL * 0.10); // 200K  
  const PENDING = TOTAL - COMPLETED - CANCELLED; // 100K

  console.log('📊 Plan:');
  console.log(`   ✅ COMPLETED: ${COMPLETED.toLocaleString()}`);
  console.log(`   ❌ CANCELLED: ${CANCELLED.toLocaleString()}`);
  console.log(`   ⏳ PENDING: ${PENDING.toLocaleString()}\n`);

  // Enable turbo mode
  await prisma.$executeRawUnsafe(`SET synchronous_commit = OFF`);
  await prisma.$executeRawUnsafe(`SET work_mem = '512MB'`);

  console.log('🚀 Creating bookings (this will take a few minutes)...\n');

  // Helper to pick random item
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  
  // Create COMPLETED bookings
  console.log(`   [1/3] Creating ${COMPLETED.toLocaleString()} COMPLETED bookings...`);
  const completedSlots = time_slots.slice(0, Math.min(COMPLETED, time_slots.length));
  
  for (let i = 0; i < COMPLETED; i += 5000) {
    const batch = Math.min(5000, COMPLETED - i);
    
    const values = Array.from({ length: batch }, (_, j) => {
      const slot = completedSlots[(i + j) % completedSlots.length];
      const student = pick(students.filter(s => s.university_id === slot.university_id));
      const consultant = pick(consultants.filter(c => c.university_id === slot.university_id));
      const category = pick(categories);
      const channel = pick(channels);
      const serviceMode = Math.random() > 0.3 ? 'ONLINE' : 'ONSITE';
      
      return `(
        ${slot.university_id},
        ${student.student_id},
        ${slot.time_slot_id},
        ${category.problem_category_id},
        ${consultant?.consultant_id || 'NULL'},
        ${serviceMode === 'ONLINE' ? channel.online_channel_category_id : 'NULL'},
        'นัดหมาย (System Generated)',
        '${serviceMode}',
        'COMPLETED',
        NOW() - INTERVAL '${Math.floor(Math.random() * 90)} days'
      )`;
    }).join(',');

    await prisma.$executeRawUnsafe(`
      INSERT INTO booking (
        university_id, student_id, time_slot_id, problem_category_id,
        consultant_id, online_channel_category_id,
        booking_detail_text, booking_service_mode, booking_status,
        booking_created_at
      ) VALUES ${values}
      ON CONFLICT DO NOTHING;
    `);

    if ((i + batch) % 50000 === 0) {
      console.log(`      Progress: ${(i + batch).toLocaleString()} / ${COMPLETED.toLocaleString()}`);
    }
  }

  // Create CANCELLED bookings
  console.log(`\n   [2/3] Creating ${CANCELLED.toLocaleString()} CANCELLED bookings...`);
  const cancelledSlots = time_slots.slice(COMPLETED, COMPLETED + CANCELLED);
  
  for (let i = 0; i < CANCELLED; i += 5000) {
    const batch = Math.min(5000, CANCELLED - i);
    
    const values = Array.from({ length: batch }, (_, j) => {
      const slot = cancelledSlots[(i + j) % cancelledSlots.length];
      const student = pick(students.filter(s => s.university_id === slot.university_id));
      const category = pick(categories);
      const channel = pick(channels);
      const serviceMode = Math.random() > 0.3 ? 'ONLINE' : 'ONSITE';
      
      return `(
        ${slot.university_id},
        ${student.student_id},
        ${slot.time_slot_id},
        ${category.problem_category_id},
        NULL,
        ${serviceMode === 'ONLINE' ? channel.online_channel_category_id : 'NULL'},
        'นัดหมาย (Cancelled)',
        '${serviceMode}',
        'CANCELLED',
        NOW() - INTERVAL '${Math.floor(Math.random() * 90)} days'
      )`;
    }).join(',');

    await prisma.$executeRawUnsafe(`
      INSERT INTO booking (
        university_id, student_id, time_slot_id, problem_category_id,
        consultant_id, online_channel_category_id,
        booking_detail_text, booking_service_mode, booking_status,
        booking_created_at
      ) VALUES ${values}
      ON CONFLICT DO NOTHING;
    `);

    if ((i + batch) % 50000 === 0) {
      console.log(`      Progress: ${(i + batch).toLocaleString()} / ${CANCELLED.toLocaleString()}`);
    }
  }

  // Create PENDING bookings
  console.log(`\n   [3/3] Creating ${PENDING.toLocaleString()} PENDING bookings...`);
  const pendingSlots = time_slots.slice(COMPLETED + CANCELLED, COMPLETED + CANCELLED + PENDING);
  
  for (let i = 0; i < PENDING; i += 5000) {
    const batch = Math.min(5000, PENDING - i);
    
    const values = Array.from({ length: batch }, (_, j) => {
      const slot = pendingSlots[(i + j) % pendingSlots.length];
      const student = pick(students.filter(s => s.university_id === slot.university_id));
      const category = pick(categories);
      const channel = pick(channels);
      const serviceMode = Math.random() > 0.3 ? 'ONLINE' : 'ONSITE';
      
      return `(
        ${slot.university_id},
        ${student.student_id},
        ${slot.time_slot_id},
        ${category.problem_category_id},
        NULL,
        ${serviceMode === 'ONLINE' ? channel.online_channel_category_id : 'NULL'},
        'รอการจัดเจ้าหน้าที่',
        '${serviceMode}',
        'PENDING_ASSIGNMENT',
        NOW() - INTERVAL '${Math.floor(Math.random() * 7)} days'
      )`;
    }).join(',');

    await prisma.$executeRawUnsafe(`
      INSERT INTO booking (
        university_id, student_id, time_slot_id, problem_category_id,
        consultant_id, online_channel_category_id,
        booking_detail_text, booking_service_mode, booking_status,
        booking_created_at
      ) VALUES ${values}
      ON CONFLICT DO NOTHING;
    `);

    if ((i + batch) % 50000 === 0) {
      console.log(`      Progress: ${(i + batch).toLocaleString()} / ${PENDING.toLocaleString()}`);
    }
  }

  console.log('\n✅ All bookings created!');
  
  // Verify
  const count = await prisma.booking.count();
  console.log(`\n📊 Final count: ${count.toLocaleString()} bookings`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
