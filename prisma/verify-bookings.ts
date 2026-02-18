// Verify booking distribution
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.booking.count();
  const completed = await prisma.booking.count({ where: { booking_status: 'COMPLETED' } });
  const pending = await prisma.booking.count({ where: { booking_status: 'PENDING_ASSIGNMENT' } });
  const cancelled = await prisma.booking.count({ where: { booking_status: 'CANCELLED' } });
  const inProgress = await prisma.booking.count({ where: { booking_status: 'IN_PROGRESS' } });

  const assignments = await prisma.bookingAssignment.count();
  const sessions = await prisma.bookingSession.count();
  const outcomes = await prisma.bookingOutcome.count();
  const feedbacks = await prisma.feedback.count();
  const ratings = await prisma.feedbackRating.count();
  const points = await prisma.studentPointTransaction.count();

  console.log('📊 Booking Distribution:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ COMPLETED: ${completed.toLocaleString()} (${(completed/total*100).toFixed(1)}%)`);
  console.log(`⏳ PENDING: ${pending.toLocaleString()} (${(pending/total*100).toFixed(1)}%)`);
  console.log(`❌ CANCELLED: ${cancelled.toLocaleString()} (${(cancelled/total*100).toFixed(1)}%)`);
  console.log(`🔄 IN_PROGRESS: ${inProgress.toLocaleString()} (${(inProgress/total*100).toFixed(1)}%)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📝 TOTAL: ${total.toLocaleString()}\n`);

  console.log('📋 Related Data:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📌 Assignments: ${assignments.toLocaleString()}`);
  console.log(`🔗 Sessions: ${sessions.toLocaleString()}`);
  console.log(`📊 Outcomes: ${outcomes.toLocaleString()}`);
  console.log(`⭐ Feedbacks: ${feedbacks.toLocaleString()}`);
  console.log(`🌟 Ratings: ${ratings.toLocaleString()}`);
  console.log(`💰 Point Transactions: ${points.toLocaleString()}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
