
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Deleting ALL bookings and slots from Feb 13, 2026 onwards...");
  
  // Target: Today/Future
  const targetDate = new Date("2026-02-12T17:00:00.000Z"); // 13 Feb 00:00 TH
  
  console.log(`Target Start (UTC): ${targetDate.toISOString()}`);

  // Helpers to capture bookings to be deleted first
  const bookingsToDelete = await prisma.booking.findMany({
    where: {
      timeSlot: { time_slot_start_datetime: { gte: targetDate } }
    },
    select: { booking_id: true }
  });

  const bookingIds = bookingsToDelete.map(b => b.booking_id);
  console.log(`Found ${bookingIds.length} future bookings to delete.`);

  if (bookingIds.length > 0) {
    // 1. Delete Dependencies
    console.log("   🗑️ Deleting related records...");

    // Feedback & Ratings
    const feedbacks = await prisma.feedback.findMany({
        where: { booking_id: { in: bookingIds } },
        select: { feedback_id: true }
    });
    const feedbackIds = feedbacks.map(f => f.feedback_id);
    if (feedbackIds.length > 0) {
        await prisma.feedbackRating.deleteMany({ where: { feedback_id: { in: feedbackIds } } });
        await prisma.feedbackComment.deleteMany({ where: { feedback_id: { in: feedbackIds } } });
        await prisma.feedback.deleteMany({ where: { feedback_id: { in: feedbackIds } } });
    }

    // Other Booking Relations
    await prisma.bookingCancellation.deleteMany({ where: { booking_id: { in: bookingIds } } });
    await prisma.bookingAssignment.deleteMany({ where: { booking_id: { in: bookingIds } } });
    await prisma.bookingOutcome.deleteMany({ where: { booking_id: { in: bookingIds } } });
    await prisma.bookingSession.deleteMany({ where: { booking_id: { in: bookingIds } } });
    await prisma.studentPointTransaction.deleteMany({ where: { booking_id: { in: bookingIds } } });
    // Add other relations if necessary (BookingConsentSignature etc.)

    // 2. Delete Bookings
    const deletedBookings = await prisma.booking.deleteMany({
      where: { booking_id: { in: bookingIds } }
    });
    console.log(`   ✅ Deleted ${deletedBookings.count} bookings.`);
  }

  // 3. Delete Slots
  const deletedSlots = await prisma.timeSlot.deleteMany({
    where: {
      time_slot_start_datetime: { gte: targetDate }
    }
  });
  console.log(`✅ Deleted ${deletedSlots.count} future slots.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
