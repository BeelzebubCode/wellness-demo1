"use client";

import { useState } from "react";
import { AiQueryInput } from "./AiQueryInput";
import { DynamicChart } from "./DynamicChart";
import { DashboardLayout } from "./DashboardLayout";

import { AnalystResponse } from "@/services/aiAgent/analyst/contracts";

export function AiAnalystDashboard({ role }: { role: "RECTOR" | "MINISTRY" }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalystResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async (query: string) => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/ai/analyst/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data: AnalystResponse = await res.json();
      setResult(data);

    } catch (err: any) {
      setError("Failed to connect to AI service.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = result?.type === "suggestions" ? result.suggestions : [];
  const message = result?.reply;
  const chartRes = result?.type === "chart" ? result : null;

  return (
    <DashboardLayout
      title="AI Analyst Insight"
      subtitle={
        role === "RECTOR"
          ? "เจาะลึกข้อมูลสุขภาพของมหาวิทยาลัยคุณด้วย AI"
          : "วิเคราะห์และเปรียบเทียบข้อมูลสุขภาพระดับประเทศ"
      }
    >
      <div className="flex flex-col h-[calc(100vh-140px)] justify-between relative z-10">
        {/* Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto pb-6 pr-2 scrollbar-hide">
          
          {error && (
            <div className="p-4 mb-6 bg-red-50/90 backdrop-blur text-red-600 rounded-xl border border-red-200">
              เกิดข้อผิดพลาด: {error}
            </div>
          )}

          {/* Welcome / Default State */}
          {!chartRes && !loading && !message && !error && (
             <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-80">
                <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm">
                   <span className="text-4xl">✨</span>
                </div>
                <div>
                   <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                    สวัสดีครับท่าน{role === "MINISTRY" ? "รัฐมนตรี" : "อธิการบดี"}
                   </h3>
                   <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-2">
                    ผมสามารถสรุปข้อมูล สถิติ และเปรียบเทียบตัวเลขทางสุขภาพจิตให้ได้ทันที
                    ลองถามผมได้เลยครับ
                   </p>
                </div>
                <div className="grid grid-cols-1 gap-3 max-w-lg w-full">
                  {["สรุปยอดการจอง 7 วันล่าสุดให้หน่อย", "คณะไหนนิสิตเครียดเยอะสุด?", "เปรียบเทียบความเครียดแต่ละมหาลัย"].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuery(q)}
                      className="px-4 py-3 text-sm bg-white/40 dark:bg-zinc-800/40 border border-white/20 rounded-xl hover:bg-white/60 transition-all text-zinc-700 dark:text-zinc-300"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
             </div>
          )}

          {/* Result Area */}
          {(message || (suggestions && suggestions.length > 0) || chartRes) && (
             <div className="space-y-6">
                {/* Text Response / Summary */}
                {message && (
                  <div className="flex gap-4 items-start bg-white/60 dark:bg-zinc-900/60 p-6 rounded-2xl border border-white/20 backdrop-blur-md shadow-sm">
                    <div className="min-w-[40px] h-[40px] rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                      AI
                    </div>
                    <div className="space-y-2">
                      <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                        {message}
                      </p>
                      {/* Bullet points if available */}
                      {chartRes?.summary?.bullets && chartRes.summary.bullets.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 mt-2 text-zinc-700 dark:text-zinc-300 bg-black/5 p-4 rounded-xl">
                          {chartRes.summary.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {suggestions && suggestions.length > 0 && (
                   <div className="ml-14 grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {suggestions.map((s, i) => (
                       <button
                        key={i}
                        onClick={() => handleQuery(s)}
                        className="text-left px-4 py-3 rounded-xl bg-white/50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-zinc-700/50 border border-transparent hover:border-blue-200 transition-all text-zinc-700 dark:text-zinc-300 text-sm"
                       >
                        ✨ {s}
                       </button>
                     ))}
                   </div>
                )}

                {/* Chart */}
                {chartRes && chartRes.chart && (
                  <div className="ml-0 md:ml-14 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                       <DynamicChart
                        type={chartRes.chart.type}
                        data={chartRes.data}
                        title={chartRes.title}
                        config={chartRes.chart}
                      />
                    </div>
                  </div>
                )}
             </div>
          )}
        </div>

        {/* Input Area (Pinned to Bottom) */}
        <div className="pt-4">
           <AiQueryInput onQuery={handleQuery} isLoading={loading} />
           <p className="text-center text-xs text-zinc-400 mt-2">
             AI อาจแสดงข้อมูลคลาดเคลื่อน โปรดตรวจสอบก่อนนำไปใช้งานระดับนโยบาย
           </p>
        </div>
      </div>

       {/* Background Decor */}
       <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-400/10 rounded-full blur-[120px]" />
       </div>
    </DashboardLayout>
  );
}
