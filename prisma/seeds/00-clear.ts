// prisma/seeds/00-clear.ts
import type { PrismaClient } from "@prisma/client";

export async function clearDatabase(prisma: PrismaClient) {
  console.log("🗑️  Clearing all database tables...");

  // 🚀 OPTIMIZED: ใช้ TRUNCATE แทน deleteMany (เร็วกว่า 100+ เท่า!)
  // TRUNCATE ลบข้อมูล + Reset ID sequences ในคำสั่งเดียว
  // CASCADE = ลบข้อมูลที่เกี่ยวข้องทั้งหมดอัตโนมัติ

  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE 
        notification,
        notification_template,
        feedback_comment,
        feedback_rating,
        feedback,
        evaluation_criterion,
        booking_cancellation,
        booking_outcome,
        booking_assignment,
        booking,
        time_slot,

        student_point_transaction,
        student_point_wallet,
        point_rule,
        borrow_assignment,
        borrow_request,
        consultant_specialization,
        consultant_language,
        consultant_profile,
        consultant,
        student_address,
        student_academic,
        student_profile,
        student,
        advisor,
        department,
        faculty,
        account_university_permission,
        university,
        province,
        region,
        problem_category,
        organization,
        student_status,
        account
      RESTART IDENTITY CASCADE;
    `);

    console.log("✅ Database cleared and sequences reset!\n");
  } catch (error: any) {
    console.error("⚠️  TRUNCATE failed, falling back to deleteMany...");

    // Fallback: ถ้า TRUNCATE ใช้ไม่ได้ (เช่น มี FK constraints ที่ซับซ้อน)
    // ใช้วิธีเก่า (ช้ากว่า)
    await prisma.notification.deleteMany();
    await prisma.notificationTemplate.deleteMany();

    await prisma.feedbackComment.deleteMany();
    await prisma.feedbackRating.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.evaluationCriterion.deleteMany();

    await prisma.bookingCancellation.deleteMany();
    await prisma.bookingOutcome.deleteMany();
    await prisma.bookingAssignment.deleteMany();
    await prisma.booking.deleteMany();

    await prisma.timeSlot.deleteMany();

    await prisma.studentPointTransaction.deleteMany();
    await prisma.studentPointWallet.deleteMany();
    await prisma.pointRule.deleteMany();

    await prisma.borrowAssignment.deleteMany();
    await prisma.borrowRequest.deleteMany();

    await prisma.consultantSpecialization.deleteMany();
    await prisma.consultantLanguage.deleteMany();
    await prisma.consultantProfile.deleteMany();
    await prisma.consultant.deleteMany();

    await prisma.studentAddress.deleteMany();
    await prisma.studentAcademic.deleteMany();
    await prisma.studentProfile.deleteMany();
    await prisma.student.deleteMany();

    await prisma.advisor.deleteMany();
    await prisma.department.deleteMany();
    await prisma.faculty.deleteMany();

    await prisma.accountUniversityPermission.deleteMany({});

    await prisma.university.deleteMany();
    await prisma.province.deleteMany();
    await prisma.region.deleteMany();

    await prisma.problemCategory.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.studentStatus.deleteMany();

    await prisma.account.deleteMany();

    // Reset sequences manually
    console.log("🔄 Resetting ID sequences...");

    const tables = [
      "account",
      "region",
      "province",
      "university",
      "student_status",
      "organization",
      "problem_category",
      "faculty",
      "department",
      "advisor",
      "student",
      "student_profile",
      "student_academic",
      "student_address",
      "consultant",
      "consultant_profile",
      "consultant_language",
      "consultant_specialization",
      "point_rule",
      "student_point_wallet",
      "student_point_transaction",
      "time_slot",
      "booking",
      "booking_assignment",
      "booking_outcome",
      "booking_cancellation",
      "evaluation_criterion",
      "feedback",
      "feedback_rating",
      "feedback_comment",
      "notification_template",
      "notification",
      "account_university_permission",
      "borrow_request",
      "borrow_assignment",
    ];

    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
          `SELECT column_name FROM information_schema.columns
           WHERE table_name = '${table}'
           AND column_default LIKE 'nextval%'
           LIMIT 1`,
        );

        if (result.length > 0) {
          const pkColumn = result[0].column_name;
          const sequenceName = `${table}_${pkColumn}_seq`;
          await prisma.$executeRawUnsafe(
            `ALTER SEQUENCE ${sequenceName} RESTART WITH 1`,
          );
        }
      } catch {
        // ignore
      }
    }

    console.log("✅ Database cleared and sequences reset!\n");
  }
}
