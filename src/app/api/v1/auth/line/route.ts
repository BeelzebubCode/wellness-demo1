// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
// import { generateToken } from '@/lib/jwt';

// type LineIdTokenPayload = {
//   sub: string; // line user id
//   name?: string;
//   picture?: string;
//   email?: string;
// };

// async function verifyLineIdToken(idToken: string): Promise<LineIdTokenPayload> {
//   const params = new URLSearchParams();
//   params.append('id_token', idToken);
//   params.append('client_id', process.env.LINE_CHANNEL_ID!);

//   const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     body: params.toString(),
//   });

//   const data = await res.json();
//   if (!res.ok) throw new Error(data?.error_description || 'LINE verify failed');

//   return data as LineIdTokenPayload;
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { idToken } = await req.json();
//     if (!idToken) {
//       return NextResponse.json({ success: false, error: 'idToken required' }, { status: 400 });
//     }

//     const payload = await verifyLineIdToken(idToken);
//     const lineUserId = payload.sub;

//     let account = await prisma.account.findUnique({
//       where: { account_line_id: lineUserId },
//     });

//     if (!account) {
//       account = await prisma.account.create({
//         data: {
//           account_line_id: lineUserId,
//           account_role: 'STUDENT',
//         },
//       });
//     }

//     const token = generateToken({
//       accountId: account.account_id,
//       role: account.account_role,
//       lineUserId: account.account_line_id,
//     });

//     return NextResponse.json({
//       success: true,
//       token,
//       account: { id: account.account_id, role: account.account_role },
//     });
//   } catch (e: any) {
//     console.error(e);
//     return NextResponse.json(
//       { success: false, error: e?.message || 'LINE login failed' },
//       { status: 500 }
//     );
//   }
// }
