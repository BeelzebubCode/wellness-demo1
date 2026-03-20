import prisma from "@/lib/prisma";

const ASSIGNMENT_TEMPLATE_CODES = ["BOOKING_ASSIGNED", "BOOKING_REASSIGNED"] as const;

export async function ensureConsultantAssignmentNotifications(accountId: number) {
  const consultant = await prisma.consultant.findUnique({
    where: { account_id: accountId },
    select: { consultant_id: true },
  });

  if (!consultant) return;

  const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const assignedBookings = await prisma.booking.findMany({
    where: {
      consultant_id: consultant.consultant_id,
      booking_status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      booking_created_at: { gte: windowStart },
      assignments: {
        some: {
          consultant_id: consultant.consultant_id,
          is_active: true,
        },
      },
    },
    select: {
      booking_id: true,
      university_id: true,
    },
    take: 100,
    orderBy: { booking_created_at: "desc" },
  });

  if (assignedBookings.length === 0) return;

  const bookingIds = assignedBookings.map((b) => b.booking_id);

  const existing = await prisma.notification.findMany({
    where: {
      account_id: accountId,
      booking_id: { in: bookingIds },
      template: {
        notification_template_code: { in: [...ASSIGNMENT_TEMPLATE_CODES] },
      },
    },
    select: { booking_id: true },
  });

  const existingBookingIds = new Set(existing.map((n) => n.booking_id).filter((id): id is number => typeof id === "number"));
  const missing = assignedBookings.filter((b) => !existingBookingIds.has(b.booking_id));
  if (missing.length === 0) return;

  const template = await prisma.notificationTemplate.upsert({
    where: { notification_template_code: "BOOKING_ASSIGNED" },
    create: {
      notification_template_code: "BOOKING_ASSIGNED",
      notification_template_title: "New booking assignment",
      notification_template_body: "You have a booking assignment waiting for your action.",
      notification_template_icon: "ASSIGN",
      notification_template_category: "ASSIGNMENT",
    },
    update: {
      notification_template_title: "New booking assignment",
      notification_template_body: "You have a booking assignment waiting for your action.",
      notification_template_icon: "ASSIGN",
      notification_template_category: "ASSIGNMENT",
    },
    select: { notification_template_id: true },
  });

  await prisma.notification.createMany({
    data: missing.map((b) => ({
      account_id: accountId,
      notification_template_id: template.notification_template_id,
      university_id: b.university_id,
      booking_id: b.booking_id,
      notification_title: "You received a new assignment",
      notification_body: "Booking #" + b.booking_id + " is waiting for your action.",
      notification_channel: "WEB",
      notification_data: {
        bookingId: b.booking_id,
        universityId: b.university_id,
        kind: "BOOKING_ASSIGNED",
        actionUrl: "/consultant/my-jobs?bookingId=" + b.booking_id,
        source: "AUTO_SYNC",
      },
    })),
    skipDuplicates: false,
  });
}
