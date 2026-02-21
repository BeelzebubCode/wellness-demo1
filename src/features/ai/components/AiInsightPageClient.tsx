"use client";

import { useState } from "react";
import AiChatCore, { AiChatMode } from "@/features/ai/components/AiChatCore";

export default function AiInsightPageClient() {
    const [mode, setMode] = useState<AiChatMode>("analyst");

    return (
        // h-[calc(100svh-64px)] = full viewport minus top nav, overflow-hidden = no page scroll
        <div className="h-[calc(100svh-64px)] w-full overflow-hidden flex flex-col bg-white">
            <AiChatCore mode={mode} variant="page" onModeChange={(m) => setMode(m)} />
        </div>
    );
}
