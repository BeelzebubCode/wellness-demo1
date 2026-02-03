// src/features/ai/components/AiChatPage.tsx

"use client";

import { useState } from "react";
import AiChatCore, { type AiChatMode } from "./AiChatCore";

export default function AiChatPage({ mode = "help" }: { mode?: AiChatMode }) {
  const [m, setM] = useState<AiChatMode>(mode);

  return (
    <AiChatCore
      key={m}
      mode={m}
      variant="page"
      onModeChange={(next) => setM(next)}
    />
  );
}
