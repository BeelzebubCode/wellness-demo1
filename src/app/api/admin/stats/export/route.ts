// src/app/api/admin/stats/export/route.ts
// ✅ Fixed: Uses data from stats/bookings endpoint

import { NextRequest, NextResponse } from 'next/server';
import { GET as getStats } from '../bookings/route';

export async function GET(req: NextRequest) {
  try {
    // Reuse logic from bookings/route.ts
    const res = await getStats(req);
    const data = await res.json();

    if (!data.bookings) {
      return NextResponse.json(
        { error: 'No data to export' },
        { status: 400 }
      );
    }

    // Create CSV
    const headers = [
      'รหัสนิสิต',
      'ชื่อ-สกุล',
      'คณะ',
      'ภาควิชา',
      'ประเภทปัญหา',
      'วันที่',
      'เวลา',
      'สถานะ',
      'ผู้ให้คำปรึกษา',
      'วันที่สร้าง',
    ];

    const rows = data.bookings.map((b: Record<string, unknown>) => [
      b.studentId ?? '',
      b.studentName ?? '',
      b.faculty ?? '',
      b.department ?? '',
      b.problemType ?? '',
      b.date ?? '',
      b.startTime ? `${b.startTime}-${b.endTime}` : '',
      translateStatus(b.status as string),
      b.consultantName ?? '',
      b.createdAt ? (b.createdAt as string).slice(0, 10) : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: (string | number | null)[]) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Add BOM for Excel Thai support
    const bom = '\uFEFF';

    return new NextResponse(bom + csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="wellness-bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting stats:', error);
    return NextResponse.json(
      { error: 'Failed to export stats' },
      { status: 500 }
    );
  }
}

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING_ASSIGNMENT: 'รอจ่ายงาน',
    ASSIGNED: 'จ่ายงานแล้ว',
    IN_PROGRESS: 'กำลังดำเนินการ',
    COMPLETED: 'เสร็จสิ้น',
    CANCELLED: 'ยกเลิก',
  };
  return statusMap[status] ?? status;
}