// src/features/ai/api/index.ts
import { postJson } from "./client";
import type { AiChatResponse, ChatMsg } from "./client";

export const aiApi = {
  chat(endpoint: string, input: { messages?: ChatMsg[]; message?: string }) {
    return postJson<AiChatResponse>(endpoint, input);
  },

  bookingConfirm(confirmToken: string) {
    return postJson<AiChatResponse>("/api/v2/ai/agent/booking/confirm", {
      confirmToken,
    });
  },
};

export type { AiChatResponse, ChatMsg } from "./client";
export type { Mode, AgentIntent } from "./endpoints";
export { detectIntent, endpointFor } from "./endpoints";
