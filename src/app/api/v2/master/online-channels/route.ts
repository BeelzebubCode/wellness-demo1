import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const channels = await prisma.onlineChannelCategory.findMany({
      where: { is_active: true },
      select: {
        online_channel_category_id: true,
        online_channel_code: true,
        online_channel_name_th: true,
        online_channel_name_en: true,
      },
      orderBy: { online_channel_code: "asc" },
    });

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("Error fetching online channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch online channels" },
      { status: 500 }
    );
  }
}
