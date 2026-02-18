// Script to clear only booking-related data
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing booking-related data...\n');

  try {
    // Delete in correct order (respecting foreign keys)
    await prisma.feedbackComment.deleteMany({});
    await prisma.feedbackRating.deleteMany({});
    await prisma.feedback.deleteMany({});
    
    await prisma.bookingCancellation.deleteMany({});
    await prisma.bookingOutcome.deleteMany({});
    await prisma.bookingSession.deleteMany({});
    await prisma.bookingAssignment.deleteMany({});
    
    await prisma.studentPointTransaction.deleteMany({});
    await prisma.studentPointWallet.deleteMany({});
    
    await prisma.booking.deleteMany({});

    console.log('✅ All booking-related data cleared!\n');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
