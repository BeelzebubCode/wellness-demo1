import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.lineId || !body.firstName || !body.lastName) {
    return NextResponse.json(
      { error: 'lineId, firstName, lastName required' },
      { status: 400 }
    );
  }

  const user = await userService.upsertLineStudent({
    lineId: body.lineId,
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    studentCode: body.studentCode,
  });

  return NextResponse.json({ success: true, user });
}
