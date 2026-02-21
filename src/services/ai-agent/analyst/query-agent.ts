import { callChatLLM } from "../core/llm/client";
import { ANALYST_SYSTEM_PROMPT } from "./prompt";
import { format } from "date-fns";
import { AnalystIntent, AnalystResponse, ChartType } from "./contracts";
import { getAiSummariesCollection } from "@/lib/mongodb";

interface AnalystQueryArgs {
  query: string;
  universityId?: number; // Core RBAC param: If set, user is restricted to this uni.
  role?: string;
}

export async function processAnalystQuery({ query, universityId, role }: AnalystQueryArgs): Promise<AnalystResponse> {
  const currentDate = format(new Date(), "yyyy-MM-dd");
  let systemContent = ANALYST_SYSTEM_PROMPT.replace("{{CURRENT_DATE}}", currentDate);

  try {
    // =========================================================
    // STEP 1: CONTEXT RETRIEVAL (MongoDB RAG)
    // =========================================================
    let mongoData: any = null;
    try {
      const collection = await getAiSummariesCollection();
      
      let level = "MINISTRY";
      let refId = null;

      if (role === "RECTOR") {
         level = "UNIVERSITY";
         refId = universityId || null;
      } else if (role === "DEAN") {
         level = "FACULTY";
         // Optional: if facultyId was passed, use it. But for now, rely on route scoping.
         // If a Dean queried without facultyId, we might need it. For now, assume it's handled.
      } else if (role === "STUDENT") {
         level = "UNIVERSITY"; // Fallback to university level for students if they ask stats
         refId = universityId || null;
      }

      console.log(`[AI_RAG] Fetching MongoDB Summary - Level: ${level}, RefId: ${refId}`);
      const summaryDoc = await collection.findOne(
        { level, reference_id: refId },
        { sort: { date: -1 } }
      );

      if (summaryDoc && summaryDoc.data) {
        mongoData = summaryDoc.data;
        systemContent += `\n\n=== RECENT STATISTICAL SUMMARY (Knowledge Base) ===\n`;
        systemContent += JSON.stringify(summaryDoc.data, null, 2);
        systemContent += `\n==========================================================\n`;
      } else {
        systemContent += `\n\n=== RECENT STATISTICAL SUMMARY ===\nNo data available currently.\n`;
      }
    } catch (dbError) {
       console.error("[AI_RAG] Failed to fetch MongoDB contexts:", dbError);
    }

    // =========================================================
    // STEP 2: GENERATION (LLM answers directly)
    // =========================================================
    const llmResponse = await callChatLLM({
      baseURL: process.env.AI_BASE_URL || "http://localhost:11434",
      model: process.env.AI_MODEL || "qwen2.5:7b",
      system: { role: "system", content: systemContent },
      messages: [{ role: "user", content: query }],
      temperature: 0.1, 
    });

    const responseText = await llmResponse.text();
    let decision: any;

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      console.error("AI Parse Error:", responseText);
      return { 
        type: "text", 
        title: "Error", 
        data: [], 
        reply: "ขออภัยครับ ระบบไม่สามารถประมวลผลคำสั่งได้ในขณะนี้ แนะนำให้ลองถามคำถามเจาะจงเกี่ยวกับสถิติการใช้งานดูครับ" 
      };
    }

    // Handle suggestions / ambiguity
    if (!decision.tool && decision.suggestions) {
      return {
        type: "suggestions",
        title: "Ambiguous Query",
        reply: decision.reply,
        suggestions: decision.suggestions,
        data: []
      };
    }

    // Formatting data for chart if any
    let chartData: any[] = [];
    let chartType: ChartType = "bar";
    let chartTitle = decision.title || "Overall Stats";
    let replyText = decision.reply;

    if (query.includes("แนวโน้ม") || query.includes("สัดส่วน")) {
        chartData = Object.entries(mongoData?.booking_stats || {}).map(([k, v]) => ({ label: k, value: v }));
        chartType = "pie";
        chartTitle = "สัดส่วนสถานะการจอง 30 วัน";
    } else if (query.includes("ปัญหา") || query.includes("อันดับ")) {
        chartData = (mongoData?.top_issues || []).map((t: any) => ({ label: t.category, value: t.count }));
        chartType = "bar";
        chartTitle = "ปัญหาที่พบบ่อย 5 อันดับแรก";
    }

    if (!replyText) {
       replyText = "ผมไม่แน่ใจว่าจะช่วยเหลืออย่างไรดีครับ แนะนำให้ถามว่า 'ปัญหาที่พบบ่อยคืออะไร' หรือ 'สถิติการจองเป็นยังไงบ้าง'";
    }

    // If no chart data, return text only
    if (chartData.length === 0) {
      return {
        type: "text",
        title: chartTitle,
        reply: replyText,
        data: []
      };
    }

    return {
      type: "chart",
      title: chartTitle,
      chartType: chartType,
      data: chartData,
      summary: replyText, // The front end chat uses 'detail' or 'reply'
      reply: replyText
    } as any; // Type override for extended response properties

  } catch (error) {
    console.error("Analyst Pipeline Error:", error);
    return {
      type: "text",
      title: "System Error",
      reply: "เกิดข้อผิดพลาดภายในระบบ",
      data: []
    };
  }
}
