"use client";

import { useState } from "react";
import AiChatCore, { AiChatMode } from "@/features/ai/components/AiChatCore";

export default function AiInsightPageClient() {
    const [mode, setMode] = useState<AiChatMode>("analyst");

    return (
        <div className="flex-1 w-full bg-white relative">
            <AiChatCore mode={mode} variant="page" onModeChange={(m) => setMode(m)} />
        </div>
    );
}
