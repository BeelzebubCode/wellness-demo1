// Script to seed only bookings
import { PrismaClient, BookingStatus } from '@prisma/client';
import { seedBookings } from './seeds/09-bookings';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Seeding bookings only...\n');

  try {
    // Fetch all required data from database
    console.log('📚 Fetching data from database...');
    const universities = await prisma.university.findMany();
    const students = await prisma.student.findMany();
    const consultants = await prisma.consultant.findMany();
    const problemCategories = await prisma.problemCategory.findMany();
    const criteria = await prisma.evaluationCriterion.findMany();
    const onlineChannels = await prisma.onlineChannelCategory.findMany();
    const cancellationReasons = await prisma.cancellationReason.findMany();
    const accounts = await prisma.account.findMany({ where: { roleCategory: { code: 'HEAD_CONSULTANT' } } });
    const pointRules = await prisma.pointRule.findMany();
    const templates = await prisma.notificationTemplate.findMany();

    // Build timeSlotsByUniId map
    const timeSlots = await prisma.timeSlot.findMany();
    const timeSlotsByUniId = new Map<number, any[]>();
    for (const slot of timeSlots) {
      if (!timeSlotsByUniId.has(slot.university_id)) {
        timeSlotsByUniId.set(slot.university_id, []);
      }
      timeSlotsByUniId.get(slot.university_id)!.push(slot);
    }

    // Build headAccountIdByUniversityId map
    const headAccountIdByUniversityId = new Map<number, number>();
    for (const acc of accounts) {
      if (acc.account_home_university_id) {
        headAccountIdByUniversityId.set(acc.account_home_university_id, acc.account_id);
      }
    }

    // Build consultantBiasById map (random bias for ratings)
    const consultantBiasById = new Map<number, number>();
    for (const consultant of consultants) {
      consultantBiasById.set(consultant.consultant_id, Math.random() * 2 + 3); // 3-5 bias
    }

    // Build point rules object
    const pointRulesObj: any = {};
    for (const rule of pointRules) {
      pointRulesObj[rule.point_rule_code] = rule;
    }

    // Find templates
    const tplCreated = templates.find(t => t.notification_template_code === 'BOOKING_CREATED');
    const tplAssigned = templates.find(t => t.notification_template_code === 'BOOKING_ASSIGNED');

    // Booking plan - 2M bookings with realistic distribution
    // 85% completed (1.7M), 5% pending (100K), 10% cancelled (200K)
    const bookingPlan: { status: BookingStatus; count: number }[] = [
      { status: BookingStatus.COMPLETED, count: 1_700_000 },
      { status: BookingStatus.IN_PROGRESS, count: 0 },
      { status: BookingStatus.PENDING_ASSIGNMENT, count: 100_000 },
      { status: BookingStatus.CANCELLED, count: 200_000 },
    ];

    console.log('✅ Data fetched successfully\n');

    await seedBookings(prisma, {
      universities,
      students,
      consultants,
      timeSlotsByUniId,
      problemCategories,
      criteria,
      headAccountIdByUniversityId,
      tplCreated: tplCreated || null,
      tplAssigned: tplAssigned || null,
      pointRules: pointRulesObj,
      pointAmount: 10,
      consultantBiasById,
      bookingPlan,
      onlineChannels,
      cancellationReasons,
    });

    console.log('\n✅ Booking seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding bookings:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
