import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";
import type { AccountContext } from "@/lib/auth/context";
import { handleAssignBooking } from "@/services/booking/handlers/assignBooking";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    const body = (await req.json().catch(() => ({}))) as {
      consultantId?: number;
      note?: string;
    };

    // ✅ (แนะนำ) ดึง booking มาก่อน เพื่อกัน assign ข้ามมหาลัยแบบชัวร์ ๆ
    const booking = await prisma.booking.findUnique({
      where: { booking_id: Number(params.id) },
      select: { booking_id: true, university_id: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
    }

    if (booking.university_id !== activeUniversityId) {
      return NextResponse.json(
        { error: "Forbidden: university" },
        { status: 403 }
      );
    }

    // ✅ เอา consultantId ของ "คนมอบหมาย" จาก consultant table (ต้อง match uni ด้วย)
    const me = await prisma.consultant.findFirst({
      where: {
        account_id: account.accountId,
        university_id: activeUniversityId,
      },
      select: { consultant_id: true },
    });

    if (!me?.consultant_id) {
      return NextResponse.json(
        {
          error:
            "ไม่พบข้อมูลผู้ให้คำปรึกษาของผู้มอบหมาย (consultantId) — ตรวจ seed ว่า HEAD_CONSULTANT มี consultant ในมหาลัยนี้แล้ว",
        },
        { status: 400 }
      );
    }

    const ctx: AccountContext = {
      accountId: account.accountId,
      username:
        (account as any)?.username ?? (account as any)?.account_username ?? "",
      role: account.role,

      // ✅ สำคัญ: ล็อกสิทธิ์ไว้แค่มหาลัย active (ตาม requirement)
      allowedUniversityIds: [activeUniversityId],

      activeUniversityId,
      consultantId: me.consultant_id,
    } as any;

    return await handleAssignBooking(ctx, params.id, body);
  } catch (e: any) {
    console.error("[V2_ASSIGN_BOOKING_POST]", e);
    const status = e?.status ?? 500;
    return NextResponse.json(
      { error: e?.message ?? "Failed to assign booking" },
      { status }
    );
  }
}
