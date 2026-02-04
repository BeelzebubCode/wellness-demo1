// src/features/ai/components/AiChatPage.tsx
"use client";

import { useState } from "react";
import AiChatCore, { type AiChatMode } from "./AiChatCore";
import styles from "./aiChatTheme.module.css";

export default function AiChatPage({ mode = "help" }: { mode?: AiChatMode }) {
  const [m, setM] = useState<AiChatMode>(mode);

  return (
    // 👇 ตรงนี้แหละ ที่เอา .pageBg มาครอบ
    <div className={styles.pageBg}>
      <AiChatCore
        mode={m}
        variant="page"
        onModeChange={(next) => setM(next)}
      />
    </div>
  );
}

