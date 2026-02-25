// src/features/ai/api/index.ts
import { postJson } from "./client";
import type { AiChatResponse, ChatMsg } from "./client";
import { AnalystResponse } from "@/services/ai-agent/analyst/types";

export const aiApi = {
  chat(endpoint: string, input: { messages?: ChatMsg[]; message?: string }) {
    return postJson<AiChatResponse>(endpoint, input);
  },

  bookingConfirm(confirmToken: string, payload?: any) {
    return postJson<AiChatResponse>("/api/v2/agent/booking/confirm", {
      confirmToken,
      ...payload,
    });
  },

  analyst(query: string) {
    return postJson<AnalystResponse>("/api/v2/agent/analyst/query", { query });
  },
};

export type { AiChatResponse, ChatMsg } from "./client";
export type { Mode, AgentIntent } from "./endpoints";
export { detectIntent, endpointFor } from "./endpoints";
