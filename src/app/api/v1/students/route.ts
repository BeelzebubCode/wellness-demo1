// src/app/api/v1/students/route.ts
// ✅ Uses Student model from schema

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/v1/students
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lineUserId = searchParams.get('lineUserId');
    const studentCode = searchParams.get('studentCode');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    // หาจาก LINE ID
    if (lineUserId) {
      where.account = {
        account_line_id: lineUserId,
      };
    }

    // หาจากรหัสนิสิต
    if (studentCode) {
      where.student_code = studentCode;
    }

    // ค้นหา
    if (search) {
      where.OR = [
        { student_code: { contains: search } },
        {
          profile: {
            OR: [
              { student_first_name: { contains: search } },
              { student_last_name: { contains: search } },
            ],
          },
        },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        profile: true,
        academic: {
          include: {
            faculty: true,
            department: true,
            advisor: true,
          },
        },
        status: true,
        account: {
          select: {
            account_username: true,
            account_line_id: true,
          },
        },
      },
      take: 50,
    });

    const formattedStudents = students.map((s) => ({
      id: s.student_id,
      code: s.student_code,
      accountId: s.account_id,
      lineUserId: s.account.account_line_id,
      status: s.status.student_status_code,

      // Profile
      name: s.profile
        ? `${s.profile.student_first_name} ${s.profile.student_last_name}`
        : null,
      firstName: s.profile?.student_first_name,
      lastName: s.profile?.student_last_name,
      nickname: s.profile?.student_nickname,
      gender: s.profile?.student_gender,
      phone: s.profile?.student_phone_number,
      email: s.profile?.student_email,

      // Academic
      faculty: s.academic?.faculty.faculty_name_th,
      department: s.academic?.department.department_name_th,
      program: s.academic?.student_program,
      degree: s.academic?.student_degree,
      admitYear: s.academic?.student_admit_academic_year,
      advisor: s.academic?.advisor
        ? `${s.academic.advisor.advisor_first_name} ${s.academic.advisor.advisor_last_name}`
        : null,
    }));

    return NextResponse.json({
      success: true,
      students: formattedStudents,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST /api/v1/students - Register student via LINE
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      lineUserId,
      lineName,
      studentCode,
      firstName,
      lastName,
      nickname,
      phone,
      email,
      facultyId,
      departmentId,
    } = body;

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE User ID จำเป็น' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี account อยู่แล้วหรือไม่
    let account = await prisma.account.findUnique({
      where: { account_line_id: lineUserId },
      include: { student: true },
    });

    // ถ้ามี student แล้ว return ข้อมูลเลย
    if (account?.student) {
      return NextResponse.json({
        success: true,
        message: 'Student already exists',
        studentId: account.student.student_id,
      });
    }

    // หา default status
    const defaultStatus = await prisma.studentStatus.findFirst({
      where: { student_status_code: 'ACTIVE' },
    });

    if (!defaultStatus) {
      return NextResponse.json(
        { error: 'ไม่พบสถานะนิสิตเริ่มต้น' },
        { status: 500 }
      );
    }

    // สร้าง account + student + profile
    const result = await prisma.$transaction(async (tx) => {
      // สร้าง account ถ้ายังไม่มี
      if (!account) {
        account = await tx.account.create({
          data: {
            account_username: `line_${lineUserId.slice(-8)}`,
            account_password: '', // ไม่ใช้ password สำหรับ LINE login
            account_role: 'STUDENT',
            account_line_id: lineUserId,
          },
          include: { student: true },
        });
      }

      // สร้าง student
      const student = await tx.student.create({
        data: {
          account_id: account.account_id,
          student_status_id: defaultStatus.student_status_id,
          student_code: studentCode,
        },
      });

      // สร้าง profile
      await tx.studentProfile.create({
        data: {
          student_id: student.student_id,
          student_first_name: firstName || lineName || 'ไม่ระบุ',
          student_last_name: lastName || '',
          student_nickname: nickname,
          student_phone_number: phone,
          student_email: email,
        },
      });

      // สร้าง academic ถ้ามีข้อมูล
      if (facultyId && departmentId) {
        await tx.studentAcademic.create({
          data: {
            student_id: student.student_id,
            faculty_id: facultyId,
            department_id: departmentId,
          },
        });
      }

      return student;
    });

    return NextResponse.json({
      success: true,
      studentId: result.student_id,
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}