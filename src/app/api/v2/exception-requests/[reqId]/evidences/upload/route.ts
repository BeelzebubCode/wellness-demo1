// src/app/api/v2/exception-requests/[reqId]/evidences/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";

type Params = { params: { reqId: string } };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const tenant = await requireTenant(req);
    const { account } = tenant;

    if (account.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    const requestId = Number(params.reqId);
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ success: false, error: "Invalid request ID" }, { status: 400 });
    }

    const exceptionRequest = await prisma.bookingExceptionRequest.findUnique({
      where: { booking_exception_request_id: requestId },
      include: {
        student: { select: { account_id: true } },
      },
    });

    if (!exceptionRequest) {
      return NextResponse.json({ success: false, error: "ไม่พบคำขอยกเว้นโทษ" }, { status: 404 });
    }

    if (exceptionRequest.student.account_id !== account.accountId) {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    if (!["DRAFT", "PENDING_REVIEW"].includes(exceptionRequest.booking_exception_status)) {
      return NextResponse.json(
        { success: false, error: "ไม่สามารถเพิ่มหลักฐานหลังจากส่งไปแล้ว" },
        { status: 422 },
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files");

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "กรุณาแนบไฟล์อย่างน้อย 1 ไฟล์" }, { status: 400 });
    }

    const evidences = [];
    const uploadDir = path.join(process.cwd(), "public", "uploads", "exceptions");

    for (const file of files) {
      if (!(file instanceof File)) continue;
      
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
         return NextResponse.json({ success: false, error: "ระบบรับเฉพาะไฟล์ PDF, PNG, JPG เท่านั้น" }, { status: 400 });
      }

      if (file.size > 10 * 1024 * 1024) {
         return NextResponse.json({ success: false, error: "ขนาดไฟล์ต้องไม่เกิน 10MB ต่อไฟล์" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg');
      const filename = `${crypto.randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, filename);
      
      await writeFile(filePath, buffer);
      
      evidences.push({
        booking_exception_request_id: requestId,
        booking_exception_evidence_url: `/uploads/exceptions/${filename}`,
        booking_exception_evidence_name: file.name,
        booking_exception_evidence_type: file.type,
        booking_exception_evidence_size: file.size,
      });
    }

    if (evidences.length > 0) {
      const created = await prisma.bookingExceptionEvidence.createMany({
        data: evidences,
      });
      return NextResponse.json({ success: true, count: created.count }, { status: 201 });
    } else {
       return NextResponse.json({ success: false, error: "ไม่พบไฟล์ที่ถูกต้อง" }, { status: 400 });
    }

  } catch (e: any) {
    console.error("[POST /api/v2/exception-requests/:reqId/evidences/upload]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
