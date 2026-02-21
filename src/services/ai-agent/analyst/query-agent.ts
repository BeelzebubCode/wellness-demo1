import { callChatLLM } from "../core/llm/client";
import { ANALYST_SYSTEM_PROMPT } from "./prompt";
import { format } from "date-fns";
import type { AnalystResponse } from "./contracts";
import { getAiSummariesCollection } from "@/lib/mongodb";

interface AnalystQueryArgs {
  query: string;
  universityId?: number;
  facultyId?: number;
  role?: string;
}

export async function processAnalystQuery({
  query,
  universityId,
  facultyId,
  role,
}: AnalystQueryArgs): Promise<AnalystResponse> {
  const currentDate = format(new Date(), "yyyy-MM-dd");
  let systemContent = ANALYST_SYSTEM_PROMPT.replace("{{CURRENT_DATE}}", currentDate);

  try {
    // =========================================================
    // STEP 1: Fetch Role-Appropriate MongoDB Context
    // =========================================================
    let mongoData: Record<string, unknown> | null = null;

    try {
      const collection = await getAiSummariesCollection();

      let level = "MINISTRY";
      let refId: number | null = null;

      if (role === "RECTOR") {
        level = "UNIVERSITY";
        refId = universityId ?? null;
      } else if (role === "DEAN") {
        level = "FACULTY";
        refId = facultyId ?? null;
        // If no facultyId, fallback to university level
        if (!refId && universityId) {
          level = "UNIVERSITY";
          refId = universityId;
        }
      } else if (role === "STUDENT" || role === "PERSONNEL") {
        level = "STUDENT";
        refId = universityId ?? null;
      }

      console.log(`[AI_RAG] Level=${level}, RefId=${refId}`);
      // Use find().sort().limit(1) because findOne doesn't support sort option in MongoDB driver
      const docs = await collection
        .find({ level, reference_id: refId })
        .sort({ generatedAt: -1 })
        .limit(1)
        .toArray();
      const doc = docs[0];

      if (doc?.data) {
        mongoData = doc.data as Record<string, unknown>;
        systemContent += `\n\n=== RECENT STATISTICAL SUMMARY (${level}) ===\n`;
        systemContent += JSON.stringify(mongoData, null, 2);
        systemContent += `\n=== END SUMMARY ===\n`;
        console.log("[AI_RAG] Context injected successfully. Data keys:", Object.keys(mongoData));
      } else {
        // Debug: check if ANY document exists for this level
        const anyDoc = await collection.findOne({ level });
        if (anyDoc) {
          console.warn(`[AI_RAG] Found docs for level=${level} but not refId=${refId}. Falling back to first found.`);
          mongoData = anyDoc.data as Record<string, unknown>;
          systemContent += `\n\n=== RECENT STATISTICAL SUMMARY (${level} - fallback) ===\n`;
          systemContent += JSON.stringify(mongoData, null, 2);
          systemContent += `\n=== END SUMMARY ===\n`;
        } else {
          systemContent += `\n\n=== RECENT STATISTICAL SUMMARY ===\nNo aggregated data available yet. Please run the data aggregation cron job.\n`;
          console.warn("[AI_RAG] No MongoDB context found at ALL for level:", level);
        }
      }
    } catch (dbErr) {
      console.error("[AI_RAG] MongoDB fetch failed:", dbErr);
    }

    // =========================================================
    // STEP 2: LLM Generation
    // =========================================================
    const llmResponse = await callChatLLM({
      baseURL: process.env.AI_BASE_URL || "http://localhost:11434",
      model: process.env.AI_MODEL || "qwen2.5:7b",
      system: { role: "system", content: systemContent },
      messages: [
        { role: "user", content: `[ตอบเป็นภาษาไทยเท่านั้น ห้ามตอบภาษาจีนหรือภาษาอื่น]\n\n${query}` }
      ],
      temperature: 0.1,
    });

    // =========================================================
    // STEP 3: Parse Ollama response envelope → extract message.content
    // =========================================================
    let llmContent = "";
    try {
      const envelope = await llmResponse.json() as { message?: { content?: string } };
      llmContent = envelope?.message?.content?.trim() ?? "";
      console.log("[AI_RAG] LLM content:", llmContent.substring(0, 300));
    } catch (parseErr) {
      console.error("[AI_RAG] Failed to parse Ollama envelope:", parseErr);
      return { type: "text", title: "AI Analyst", reply: "ขออภัยครับ ระบบไม่ตอบสนอง", data: [] };
    }

    // =========================================================
    // STEP 4: Extract the JSON {reply} from LLM content
    // =========================================================
    let decision: { thought?: string; reply?: string } = {};
    try {
      // LLM content should be: { "thought": "...", "reply": "..." }
      // Use greedy match to get the whole JSON block
      const jsonMatch = llmContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: treat the entire content as the reply
        decision = { reply: llmContent };
      }
    } catch {
      console.warn("[AI_RAG] Inner JSON parse failed, using raw content as reply.");
      decision = { reply: llmContent };
    }

    const replyText =
      decision.reply?.trim() ||
      llmContent.trim() ||
      "ขออภัยครับ ระบบไม่สามารถสรุปผลได้ในขณะนี้ โปรดลองถามใหม่อีกครั้ง";

    // =========================================================
    // STEP 4: Auto-detect if the response warrants a chart
    // =========================================================
    const lq = query.toLowerCase();
    const isStressQuery =
      lq.includes("เครียด") || lq.includes("stress") || lq.includes("อันดับ") || lq.includes("ranking");
    const isTrendQuery =
      lq.includes("แนวโน้ม") || lq.includes("trend") || lq.includes("รายวัน");
    const isIssueQuery =
      lq.includes("ปัญหา") || lq.includes("issue") || lq.includes("หมวด");
    const isSlotQuery =
      lq.includes("ว่าง") || lq.includes("นัด") || lq.includes("slot") || lq.includes("วัน");

    // Try to extract chart data from the MongoDB context
    if (mongoData && (isStressQuery || isTrendQuery || isIssueQuery) && !isSlotQuery) {
      let chartData: Array<{ label: string; value: number }> = [];
      let chartType: "bar" | "line" | "pie" = "bar";
      let chartTitle = "สถิติ";

      if (isStressQuery && mongoData.faculty_ranking_by_stress) {
        const ranking = mongoData.faculty_ranking_by_stress as Array<{ faculty_name: string; stress_score: number }>;
        chartData = ranking.slice(0, 10).map((r) => ({ label: r.faculty_name, value: r.stress_score }));
        chartType = "bar";
        chartTitle = "อันดับคณะที่มี Stress Score สูงสุด";
      } else if (isStressQuery && mongoData.university_ranking_by_stress) {
        const ranking = mongoData.university_ranking_by_stress as Array<{ university_name: string; stress_score: number }>;
        chartData = ranking.slice(0, 10).map((r) => ({ label: r.university_name, value: r.stress_score }));
        chartType = "bar";
        chartTitle = "อันดับมหาวิทยาลัยที่มี Stress Score สูงสุด";
      } else if (isTrendQuery && mongoData.daily_trend) {
        const trend = mongoData.daily_trend as Array<{ date: string; count: number }>;
        chartData = trend.map((r) => ({ label: r.date, value: r.count }));
        chartType = "line";
        chartTitle = "แนวโน้มการจองรายวัน 30 วัน";
      } else if (isIssueQuery && mongoData.top_issues) {
        const issues = mongoData.top_issues as Array<{ category: string; count: number }>;
        chartData = issues.map((r) => ({ label: r.category, value: r.count }));
        chartType = "pie";
        chartTitle = "ปัญหาที่พบบ่อยสุด";
      }

      if (chartData.length > 0) {
        return {
          type: "chart",
          title: chartTitle,
          data: chartData,
          chart: { type: chartType },
          reply: replyText,
          summary: { bullets: [replyText] },
        } as AnalystResponse;
      }
    }

    // Default: text response
    return {
      type: "text",
      title: "AI Analyst",
      reply: replyText,
      data: [],
    };
  } catch (error) {
    console.error("[Analyst] Pipeline Error:", error);
    return {
      type: "text",
      title: "System Error",
      reply: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้งครับ",
      data: [],
    };
  }
}
