// src/services/aiAgent/help/engine.ts
import type { ChatMsg } from "../core/types";
import { callChatLLM } from "../core/llm/client";
import { buildHelpSystemPrompt, buildKbSystemPrefix } from "../core/prompts/help";
import { normalizeThaiLoose } from "../core/nlp/thai";
import { loadPolicyBannedWords, checkProfanityOrNull } from "./policy";
import { retrieveKb, formatKbText } from "./kb";
import type { HelpParams, RunHelpResult } from "./types";

type HelpEngineConfig = {
  aiBaseURL: string;
  aiModel: string;
  timeoutMs?: number;
  temperature?: number;
};

export class HelpEngine {
  constructor(private cfg: HelpEngineConfig) {}

  async run(args: HelpParams & { tenantCode?: string }): Promise<RunHelpResult> {
    const raw = (args.question ?? "").trim();
    const question = normalizeThaiLoose(raw);

    if (!question) {
      return {
        blocked: false,
        kbText: "",
        reply: "พิมพ์คำถามสั้น ๆ ให้ผมหน่อยครับ 🙂",
        meta: { usedKb: 0, usedDocs: [], usedChunks: [], policyLoaded: false },
      };
    }

    // 1) policy
    const policy = await loadPolicyBannedWords();
    const hit = checkProfanityOrNull(question, policy);
    if (hit) {
      return {
        blocked: true,
        kbText: "",
        reply: policy?.warning || "ขอความกรุณาใช้ถ้อยคำสุภาพในการสนทนานะครับ 🙂",
        meta: {
          hit: hit.hit,
          policyLoaded: true,
          usedKb: 0,
          usedDocs: [],
          usedChunks: [],
        },
      };
    }

    // 2) KB
    const kb = await retrieveKb({
      q: question,
      universityId: args.universityId ?? null,
      role: args.role ?? null,
      take: 6,
      allowedDocKeys: args.allowedDocKeys,
    });

    const kbText = formatKbText(kb);

    const usedDocs = Array.from(
      new Map(kb.map((x) => [x.key, { key: x.key, title: x.title, documentId: x.documentId }])).values(),
    );

    // 3) LLM (ถ้าไม่มี kbText ก็ยังตอบได้)
    const system: ChatMsg = {
      role: "system",
      content: buildHelpSystemPrompt(args.tenantCode),
    };

    const messages: ChatMsg[] = [];
    if (kbText) {
      messages.push({
        role: "system",
        content: buildKbSystemPrefix() + kbText,
      });
    }

    messages.push({ role: "user", content: question });

    const r = await callChatLLM({
      baseURL: this.cfg.aiBaseURL,
      model: this.cfg.aiModel,
      system,
      messages,
      timeoutMs: this.cfg.timeoutMs ?? 20000,
      temperature: this.cfg.temperature ?? 0.2,
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return {
        blocked: false,
        kbText,
        reply: "ขอโทษครับ ตอนนี้ตอบไม่ได้ ลองใหม่อีกครั้ง",
        meta: {
          usedKb: kb.length,
          usedDocs,
          usedChunks: kb.map((x) => ({
            key: x.key,
            title: x.title,
            chunkId: x.chunkId,
            documentId: x.documentId,
            versionId: x.versionId,
            publishedVersionId: x.publishedVersionId,
          })),
          policyLoaded: Boolean(policy),
          providerStatus: r.status,
          providerDetail: detail.slice(0, 300),
        } as any,
      };
    }

    const data = await r.json().catch(() => ({} as any));
    const content = String(data?.message?.content ?? "").trim() || "ขอโทษครับ ตอนนี้ตอบไม่ได้ ลองใหม่อีกครั้ง";

    return {
      blocked: false,
      kbText,
      reply: content,
      meta: {
        usedKb: kb.length,
        usedDocs,
        usedChunks: kb.map((x) => ({
          key: x.key,
          title: x.title,
          chunkId: x.chunkId,
          documentId: x.documentId,
          versionId: x.versionId,
          publishedVersionId: x.publishedVersionId,
        })),
        policyLoaded: Boolean(policy),
      },
    };
  }
}
