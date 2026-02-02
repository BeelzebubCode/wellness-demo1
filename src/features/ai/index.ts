// components (default export -> re-export แบบนี้)
export { default as AiChatPage } from "./components/AiChatPage";
export { default as AiChatModal } from "./components/AiChatModal";
export { default as FloatingAiButton } from "./components/FloatingAiButton";

// hooks / store (named export)
export { useAiChat } from "./hooks/useAiChat";
export { useAiWidget } from "./widget/useAiWidget";

// api
export * from "./api/client";      // types + postJson
export * from "./api/endpoints";   // endpoint helper/const ถ้ามี
export { aiApi } from "./api";     // ให้มีไฟล์ api/index.ts รวม aiApi (ด้านล่าง)
