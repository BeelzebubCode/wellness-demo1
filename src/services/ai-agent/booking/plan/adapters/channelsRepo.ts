// src/services/ai-agent/booking/plan/adapters/channelsRepo.ts
import prisma from "@/lib/prisma";

export type OnlineChannelRow = {
    online_channel_category_id: number;
    online_channel_code: string;
    online_channel_name_th: string;
    online_channel_name_en: string | null;
};

export async function loadOnlineChannels(): Promise<OnlineChannelRow[]> {
    return prisma.onlineChannelCategory.findMany({
        where: { is_active: true },
        orderBy: { online_channel_category_id: "asc" },
        select: {
            online_channel_category_id: true,
            online_channel_code: true,
            online_channel_name_th: true,
            online_channel_name_en: true,
        },
    });
}
