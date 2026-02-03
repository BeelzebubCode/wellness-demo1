// src/services/aiAgent/help/runHelp.ts
import { HelpEngine } from "./engine";
import type { HelpParams, RunHelpResult } from "./types";

const engine = new HelpEngine({
  aiBaseURL: (process.env.AI_BASE_URL || "http://localhost:11434").replace(/\/+$/, ""),
  aiModel: process.env.AI_MODEL || "qwen2.5:7b",
  timeoutMs: 20000,
  temperature: 0.2,
});

export async function runHelp(args: HelpParams & { tenantCode?: string }): Promise<RunHelpResult> {
  return engine.run(args);
}
