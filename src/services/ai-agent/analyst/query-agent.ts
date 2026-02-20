import { callChatLLM } from "../core/llm/client";
import { tools } from "./tools";
import { ANALYST_SYSTEM_PROMPT } from "./prompt";
import { format } from "date-fns";
import { AnalystIntent, AnalystResponse, ChartType } from "./contracts";

interface AnalystQueryArgs {
  query: string;
  universityId?: number; // Core RBAC param: If set, user is restricted to this uni.
}

export async function processAnalystQuery({ query, universityId }: AnalystQueryArgs): Promise<AnalystResponse> {
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const systemContent = ANALYST_SYSTEM_PROMPT.replace("{{CURRENT_DATE}}", currentDate);

  try {
    // =========================================================
    // STEP 1: PLANNER (AI decides Intent)
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
        reply: "ขออภัยครับ ระบบไม่สามารถประมวลผลคำสั่งได้ในขณะนี้" 
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

    if (!decision.tool) {
      return {
        type: "text",
        title: "No Tool Selected",
        reply: decision.reply || "ผมไม่แน่ใจว่าจะช่วยเหลืออย่างไรดีครับ",
        data: []
      };
    }

    // =========================================================
    // STEP 2: EXECUTOR (Server runs tool & safeguards)
    // =========================================================
    const selectedTool = tools.find(t => t.name === decision.tool);
    if (!selectedTool) {
      return { 
        type: "text", 
        title: "Tool Not Found", 
        reply: `ไม่พบเครื่องมือ: ${decision.tool}`, 
        data: [] 
      };
    }

    // ENFORCE RBAC: If universityId is present, overwrite it in args.
    const safeArgs = { ...decision.args };
    if (universityId) {
      safeArgs.universityId = universityId; 
    }

    // EXECUTE
    // Expect tools to return { data: any[], summary: string, recommendedChart?: string, ...keys }
    const rawResult = await selectedTool.execute(safeArgs);

    // =========================================================
    // STEP 3: ANALYST (Generate Insight / Summary)
    // =========================================================
    // The user explicitly requested a "Speech/Text Summary" because the Minister is busy.
    // We will ask the LLM to summarize the data briefly.
    
    let aiSummary = rawResult.summary;
    if (rawResult.data && rawResult.data.length > 0) {
       try {
          const summaryPrompt = `
You are an expert data analyst for the Ministry of Higher Education.
Summarize the following data into a short, insightful paragraph (in Thai) suitable for a busy Minister.
Focus on the key trend, the highest/lowest values, or the answer to: "${query}".
Do not simply list numbers. Interpret them.

Data: ${JSON.stringify(rawResult.data.slice(0, 5))} ... (Total ${rawResult.data.length} items)
context: ${rawResult.summary}
`;
          const summaryRes = await callChatLLM({
             baseURL: process.env.AI_BASE_URL || "http://localhost:11434",
             model: process.env.AI_MODEL || "qwen2.5:7b",
             system: { role: "system", content: "You are a helpful assistant summarizing data." },
             messages: [{ role: "user", content: summaryPrompt }],
             temperature: 0.3,
          });
          aiSummary = await summaryRes.text();
       } catch (e) {
          console.error("Summary gen failed", e);
       }
    }

    // =========================================================
    // STEP 4: FORMATTER (Normalize to Contract)
    // =========================================================
    
    // Auto-select chart heuristic
    let chartType: ChartType = "bar"; // default
    
    // Use tool recommendation if sensible
    if ((rawResult as any).recommendedChart && ["bar", "line", "pie"].includes((rawResult as any).recommendedChart)) {
      chartType = (rawResult as any).recommendedChart as ChartType;
    } else {
      // Simple Heuristic Fallback
      if (rawResult.data && rawResult.data.length > 0) {
        const first = rawResult.data[0];
        if ("date" in first) chartType = "line"; // Time series
        else if (rawResult.data.length <= 6 && !("date" in first)) chartType = "pie"; // Small categorical
        else chartType = "bar"; // Comparison
      }
    }

    // Map result to AnalystResponse
    const response: AnalystResponse = {
      type: "chart",
      title: rawResult.summary || decision.view?.titleHint || "Analysis Result",
      description: decision.thought,
      chart: {
        type: chartType,
        xKey: (rawResult as any).xAxisKey || "name", // standard defaults
        yKey: (rawResult as any).dataKey || "value", 
        dataKey: (rawResult as any).dataKey || "value", // for pie
        nameKey: (rawResult as any).xAxisKey || "name", // for pie
      },
      data: Array.isArray(rawResult.data) ? rawResult.data : [],
      summary: {
        bullets: rawResult.summary ? [rawResult.summary] : []
      },
      reply: aiSummary // Inject the AI generated summary here
    };

    return response;

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
