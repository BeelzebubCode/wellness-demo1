import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET() {
  try {
    const channels = await prisma.onlineChannelCategory.findMany({
      where: { is_active: true },
      select: {
        online_channel_category_id: true,
        online_channel_code: true,
        online_channel_name_th: true,
        online_channel_name_en: true,
        online_channel_icon_key: true,
      },
      orderBy: { online_channel_category_id: "asc" },
    });

    // "OTHER" always last
    const sorted = channels.sort((a, b) => {
      const aOther = a.online_channel_code === "OTHER" ? 1 : 0;
      const bOther = b.online_channel_code === "OTHER" ? 1 : 0;
      return aOther - bOther;
    });

    return NextResponse.json({ channels: sorted });
  } catch (error) {
    console.error("Error fetching online channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch online channels" },
      { status: 500 }
    );
  }
}

// GET all channels (including inactive) for admin
export async function POST(req: NextRequest) {
  try {
    const token = await verifyToken(
      req.cookies.get("auth_token")?.value || ""
    );
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Action: list_all — return all channels including inactive
    if (body.action === "list_all") {
      const channels = await prisma.onlineChannelCategory.findMany({
        orderBy: { online_channel_category_id: "asc" },
      });
      return NextResponse.json({ channels });
    }

    // Action: update — update a specific channel
    if (body.action === "update") {
      const { id, icon_key, name_th, name_en, is_active } = body;
      if (!id) {
        return NextResponse.json({ error: "Missing channel id" }, { status: 400 });
      }

      const updated = await prisma.onlineChannelCategory.update({
        where: { online_channel_category_id: Number(id) },
        data: {
          ...(icon_key !== undefined && { online_channel_icon_key: icon_key }),
          ...(name_th !== undefined && { online_channel_name_th: name_th }),
          ...(name_en !== undefined && { online_channel_name_en: name_en }),
          ...(is_active !== undefined && { is_active: Boolean(is_active) }),
        },
      });

      return NextResponse.json({ success: true, channel: updated });
    }

    // Action: create — create a new channel
    if (body.action === "create") {
      const { code, name_th, name_en, icon_key } = body;
      if (!code || !name_th) {
        return NextResponse.json({ error: "Missing code or name_th" }, { status: 400 });
      }

      const created = await prisma.onlineChannelCategory.create({
        data: {
          online_channel_code: code,
          online_channel_name_th: name_th,
          online_channel_name_en: name_en ?? null,
          online_channel_icon_key: icon_key ?? "message",
          is_active: true,
        },
      });

      return NextResponse.json({ success: true, channel: created });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating online channel:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}
