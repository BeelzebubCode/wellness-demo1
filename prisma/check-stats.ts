// Script to check current data counts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.count();
  const timeSlots = await prisma.timeSlot.count();
  const consultants = await prisma.consultant.count();
  const bookings = await prisma.booking.count();
  const universities = await prisma.university.count();

  console.log('📊 Current Database Stats:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏫 Universities: ${universities.toLocaleString()}`);
  console.log(`🎓 Students: ${students.toLocaleString()}`);
  console.log(`👔 Consultants: ${consultants.toLocaleString()}`);
  console.log(`📅 Time Slots: ${timeSlots.toLocaleString()}`);
  console.log(`📝 Bookings: ${bookings.toLocaleString()}`);
  console.log('\n💡 Capacity for 2M bookings:');
  console.log(`   Students can book: ${students.toLocaleString()} students`);
  console.log(`   Available slots: ${timeSlots.toLocaleString()} slots`);
  console.log(`   Avg bookings/student for 2M: ${(2000000 / students).toFixed(1)}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
