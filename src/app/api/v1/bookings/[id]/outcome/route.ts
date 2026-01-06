import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);
    const body = await request.json();
    const { note, nextStep, riskLevel } = body;

    // 1. Validation
    if (!note || !riskLevel) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (Note, Risk Level)' },
        { status: 400 }
      );
    }

    // 2. ใช้ Transaction เพื่อความสมบูรณ์ของข้อมูล (ต้องสำเร็จทั้งคู่ หรือล้มเหลวทั้งคู่)
    const result = await prisma.$transaction(async (tx) => {
      
      // 2.1 สร้าง Booking Outcome
      const outcome = await tx.bookingOutcome.create({
        data: {
          booking_id: bookingId,
          booking_outcome_consultant_note: note,
          booking_outcome_next_step: nextStep || null,
          booking_outcome_risk_level: riskLevel,
          booking_outcome_recorded_at: new Date(),
        },
      });

      // 2.2 อัพเดทสถานะ Booking เป็น COMPLETED
      const updatedBooking = await tx.booking.update({
        where: { booking_id: bookingId },
        data: {
          booking_status: 'COMPLETED',
          booking_updated_at: new Date(),
        },
      });

      return { outcome, updatedBooking };
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error saving outcome:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    );
  }
}