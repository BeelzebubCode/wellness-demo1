// src/app/api/webhooks/line/route.ts
// ✅ Fixed: Uses Account, Student, Booking models from schema

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// Types
interface LineWebhookEvent {
  type: string;
  replyToken?: string;
  source: {
    userId?: string;
    type: string;
  };
  message?: {
    type: string;
    text?: string;
  };
}

interface LineWebhookBody {
  events: LineWebhookEvent[];
}

// Verify LINE signature
function verifySignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  if (!channelSecret) return false;

  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

// Send LINE message
async function sendLineMessage(userId: string, messages: unknown[]) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not configured');
    return;
  }

  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: userId,
        messages,
      }),
    });
  } catch (error) {
    console.error('Error sending LINE message:', error);
  }
}

// Reply LINE message
async function replyLineMessage(replyToken: string, messages: unknown[]) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not configured');
    return;
  }

  try {
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });
  } catch (error) {
    console.error('Error replying LINE message:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') || '';

    // Verify signature in production
    if (process.env.NODE_ENV === 'production' && !verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data: LineWebhookBody = JSON.parse(body);
    const events = data.events || [];

    for (const event of events) {
      await handleEvent(event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('LINE webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleEvent(event: LineWebhookEvent) {
  const userId = event.source.userId;
  if (!userId) return;

  // Handle follow event (user adds bot)
  if (event.type === 'follow') {
    await handleFollow(userId, event.replyToken);
    return;
  }

  // Handle message event
  if (event.type === 'message' && event.message?.type === 'text') {
    await handleMessage(userId, event.message.text || '', event.replyToken);
  }
}

async function handleFollow(userId: string, replyToken?: string) {
  const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`;

  const messages = [
    {
      type: 'text',
      text: `🌿 ยินดีต้อนรับสู่ NU Wellness Center\n\nบริการให้คำปรึกษาด้านสุขภาพจิตสำหรับนิสิต\n\n📅 จองคิว: ${liffUrl}\n\nพิมพ์ "help" เพื่อดูคำสั่งทั้งหมด`,
    },
  ];

  if (replyToken) {
    await replyLineMessage(replyToken, messages);
  }
}

async function handleMessage(userId: string, text: string, replyToken?: string) {
  const lowerText = text.toLowerCase().trim();
  const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`;

  // Command: จอง / booking
  if (lowerText.includes('จอง') || lowerText.includes('booking')) {
    const messages = [
      {
        type: 'text',
        text: `📅 จองคิวให้คำปรึกษา\n\nคลิกลิงก์ด้านล่าง:\n${liffUrl}`,
      },
    ];
    if (replyToken) await replyLineMessage(replyToken, messages);
    return;
  }

  // Command: ตาราง / นัด / appointment
  if (
    lowerText.includes('ตาราง') ||
    lowerText.includes('นัด') ||
    lowerText.includes('appointment')
  ) {
    await handleCheckAppointment(userId, replyToken);
    return;
  }

  // Command: ยกเลิก / cancel
  if (lowerText.includes('ยกเลิก') || lowerText.includes('cancel')) {
    const messages = [
      {
        type: 'text',
        text: `❌ ยกเลิกการจอง\n\nกรุณาไปที่เมนู "การจองของฉัน" ในแอปพลิเคชัน:\n${liffUrl}/my-appointments`,
      },
    ];
    if (replyToken) await replyLineMessage(replyToken, messages);
    return;
  }

  // Command: help
  if (lowerText.includes('help') || lowerText.includes('ช่วย') || lowerText === '?') {
    const messages = [
      {
        type: 'text',
        text: `💚 NU Wellness Center\n\n📌 คำสั่งที่ใช้ได้:\n• "จอง" - จองคิวให้คำปรึกษา\n• "ตาราง" - ดูการจองของคุณ\n• "ยกเลิก" - ยกเลิกการจอง\n• "help" - ดูคำสั่งทั้งหมด\n\n🔗 หรือใช้งานผ่าน:\n${liffUrl}`,
      },
    ];
    if (replyToken) await replyLineMessage(replyToken, messages);
    return;
  }

  // Default response
  const messages = [
    {
      type: 'text',
      text: `🤔 ไม่เข้าใจคำสั่ง\n\nพิมพ์ "help" เพื่อดูคำสั่งทั้งหมด\n\nหรือจองคิวได้ที่:\n${liffUrl}`,
    },
  ];
  if (replyToken) await replyLineMessage(replyToken, messages);
}

async function handleCheckAppointment(userId: string, replyToken?: string) {
  try {
    // หา student จาก LINE ID
    const account = await prisma.account.findUnique({
      where: { account_line_id: userId },
      include: {
        student: true,
      },
    });

    if (!account?.student) {
      const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`;
      const messages = [
        {
          type: 'text',
          text: `📭 ไม่พบข้อมูลของคุณในระบบ\n\nกรุณาลงทะเบียนก่อนจองคิว:\n${liffUrl}`,
        },
      ];
      if (replyToken) await replyLineMessage(replyToken, messages);
      return;
    }

    // หา booking ที่ active
    const booking = await prisma.booking.findFirst({
      where: {
        student_id: account.student.student_id,
        booking_status: {
          in: ['PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS'],
        },
      },
      include: {
        problemCategory: true,
        consultant: {
          include: {
            profile: true,
          },
        },
        bookingSlots: {
          include: {
            timeSlot: true,
          },
        },
      },
      orderBy: { booking_created_at: 'desc' },
    });

    if (!booking) {
      const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`;
      const messages = [
        {
          type: 'text',
          text: `📭 คุณไม่มีการจองที่กำลังดำเนินการ\n\nพิมพ์ "จอง" หรือคลิก:\n${liffUrl}`,
        },
      ];
      if (replyToken) await replyLineMessage(replyToken, messages);
      return;
    }

    // Format booking info
    const timeSlot = booking.bookingSlots[0]?.timeSlot;
    const consultantName = booking.consultant?.profile
      ? `${booking.consultant.profile.consultant_first_name} ${booking.consultant.profile.consultant_last_name}`
      : 'รอการจ่ายงาน';

    const statusText: Record<string, string> = {
      PENDING_ASSIGNMENT: '⏳ รอจ่ายงาน',
      ASSIGNED: '✅ นัดหมายแล้ว',
      IN_PROGRESS: '🔄 กำลังดำเนินการ',
    };

    const dateStr = timeSlot
      ? new Date(timeSlot.time_slot_start_datetime).toLocaleDateString('th-TH', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'รอกำหนด';

    const timeStr = timeSlot
      ? `${timeSlot.time_slot_start_datetime.toTimeString().slice(0, 5)} - ${timeSlot.time_slot_end_datetime.toTimeString().slice(0, 5)} น.`
      : 'รอกำหนด';

    const messages = [
      {
        type: 'text',
        text: `📋 การจองของคุณ\n\n📅 วันที่: ${dateStr}\n🕐 เวลา: ${timeStr}\n📝 ประเภท: ${booking.problemCategory.problem_category_name_th}\n👨‍⚕️ ผู้ให้คำปรึกษา: ${consultantName}\n\n${statusText[booking.booking_status] || booking.booking_status}`,
      },
    ];
    if (replyToken) await replyLineMessage(replyToken, messages);
  } catch (error) {
    console.error('Error checking appointment:', error);
    const messages = [
      {
        type: 'text',
        text: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      },
    ];
    if (replyToken) await replyLineMessage(replyToken, messages);
  }
}