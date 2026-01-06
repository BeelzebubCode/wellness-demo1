import prisma from '@/lib/prisma';
import type { AccountRole } from '@prisma/client';

/* ============================
   DTOs
============================ */

export interface UpsertLineUserDTO {
  lineId: string;
  role?: AccountRole; // default STUDENT

  // profile
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  studentCode?: string;
}

/* ============================
   Response
============================ */

export interface UserResponse {
  accountId: number;
  role: AccountRole;
  lineId: string | null;

  studentId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  studentCode: string | null;
}

/* ============================
   Service
============================ */

export const userService = {
  // 🔍 GET by LINE ID
  async getByLineId(lineId: string): Promise<UserResponse | null> {
    const account = await prisma.account.findUnique({
      where: { account_line_id: lineId },
      include: {
        student: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!account || !account.student || !account.student.profile) {
      return null;
    }

    return formatStudent(account);
  },

  // 🔁 UPSERT (LINE Login)
  async upsertLineStudent(data: UpsertLineUserDTO): Promise<UserResponse> {
    const account = await prisma.account.upsert({
      where: {
        account_line_id: data.lineId,
      },
      update: {},
      create: {
        account_username: `line_${data.lineId}`,
        account_password: '-', // LINE login ไม่มี password
        account_role: data.role ?? 'STUDENT',
        account_line_id: data.lineId,

        student: {
          create: {
            student_status_id: 1, // ACTIVE (ต้องมี record นี้)
            student_code: data.studentCode ?? null,

            profile: {
              create: {
                student_first_name: data.firstName,
                student_last_name: data.lastName,
                student_email: data.email ?? null,
                student_phone_number: data.phone ?? null,
              },
            },
          },
        },
      },
      include: {
        student: {
          include: {
            profile: true,
          },
        },
      },
    });

    return formatStudent(account);
  },
};

/* ============================
   Formatter
============================ */

function formatStudent(account: any): UserResponse {
  const student = account.student;
  const profile = student.profile;

  return {
    accountId: account.account_id,
    role: account.account_role,
    lineId: account.account_line_id,

    studentId: student.student_id,
    firstName: profile.student_first_name,
    lastName: profile.student_last_name,
    email: profile.student_email,
    phone: profile.student_phone_number,
    studentCode: student.student_code,
  };
}

export default userService;