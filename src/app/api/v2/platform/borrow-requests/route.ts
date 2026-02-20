// src/app/api/v2/platform/borrow-requests/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { platformListBorrowRequests } from "@/services/borrow-requests/handlers/platformListBorrowRequests";
import { getAccountId } from "@/services/borrow-requests/helpers";

export async function GET(req: NextRequest) {
  try {
    const { account } = await requireTenant(req);
    assertRole(account.role, ["SUPER_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");

    console.log('📥 API Request:', { status, page, pageSize });

    const result = await platformListBorrowRequests({
      accountId: getAccountId(account),
      status,
      page,
      pageSize,
    });

    console.log('📤 API Response:', { 
      itemsCount: result.items?.length, 
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    });

    // ✅ Format ที่ FE คาดหวัง
    return NextResponse.json({
      ok: true,
      data: {
        items: result.items,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      }
    });
  } catch (e: any) {
    console.error('❌ Platform List Error:', e);
    return NextResponse.json(
      { 
        ok: false, 
        error: e?.message ?? "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? e?.stack : undefined
      },
      { status: 400 }
    );
  }
}