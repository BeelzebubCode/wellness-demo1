import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAiSummariesCollection } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[CRON] Starting Daily AI Summary Aggregation...');
    const collection = await getAiSummariesCollection();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Gather Ministry Level (Global)
    console.log('Fetching Ministry Level Data...');
    const totalUniversities = await prisma.university.count({ where: { university_is_active: true } });
    const totalStudents = await prisma.student.count();
    const totalConsultants = await prisma.consultant.count();
    const totalBookings = await prisma.booking.count();
    const pendingBookings = await prisma.booking.count({ where: { booking_status: 'PENDING_ASSIGNMENT' } });

    const ministryMetrics = {
      total_universities: totalUniversities,
      total_students: totalStudents,
      total_consultants: totalConsultants,
      total_bookings_all_time: totalBookings,
      pending_bookings_queue: pendingBookings,
    };

    await collection.insertOne({
      level: 'MINISTRY',
      reference_id: null,
      date: today,
      metrics: ministryMetrics,
      pre_analysis: "Ministry global overview collected.",
      created_at: new Date()
    });

    // 2. Gather University Level (Rector)
    console.log('Fetching University Level Data...');
    const universities = await prisma.university.findMany({ select: { university_id: true, university_name_th: true, university_code: true } });
    
    for (const uni of universities) {
      const uniStudents = await prisma.student.count({ where: { university_id: uni.university_id } });
      const uniConsultants = await prisma.consultant.count({ where: { university_id: uni.university_id } });
      const uniBookings = await prisma.booking.count({ where: { university_id: uni.university_id } });
      const uniPending = await prisma.booking.count({ where: { university_id: uni.university_id, booking_status: 'PENDING_ASSIGNMENT' } });
      
      await collection.insertOne({
        level: 'UNIVERSITY',
        reference_id: uni.university_id,
        date: today,
        metrics: {
          university_name: uni.university_name_th,
          total_students: uniStudents,
          total_consultants: uniConsultants,
          total_bookings: uniBookings,
          queue_size: uniPending,
        },
        pre_analysis: `University ${uni.university_code} overview collected.`,
        created_at: new Date()
      });
    }

    // 3. Gather Faculty Level (Dean)
    console.log('Fetching Faculty Level Data...');
    const faculties = await prisma.faculty.findMany({ select: { faculty_id: true, faculty_name_th: true, university_id: true } });
    
    for (const fac of faculties) {
      const facStudents = await prisma.student.count({ where: { academic: { faculty_id: fac.faculty_id } } });
      const facAdvisors = await prisma.advisor.count({ where: { faculty_id: fac.faculty_id } });
      const facBookings = await prisma.booking.count({ where: { student: { academic: { faculty_id: fac.faculty_id } } } });
      
      await collection.insertOne({
        level: 'FACULTY',
        reference_id: fac.faculty_id,
        date: today,
        metrics: {
          faculty_name: fac.faculty_name_th,
          total_students: facStudents,
          total_advisors: facAdvisors,
          total_student_bookings: facBookings
        },
        pre_analysis: `Faculty ${fac.faculty_name_th} overview collected.`,
        created_at: new Date()
      });
    }

    console.log('[CRON] AI Summary Aggregation Complete.');
    return NextResponse.json({ success: true, message: 'Aggregation to MongoDB complete' });
  } catch (error: any) {
    console.error('[CRON_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
