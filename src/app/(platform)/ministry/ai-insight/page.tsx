import { Metadata } from "next";
import AiInsightPageClient from "@/features/ai/components/AiInsightPageClient";

export const metadata: Metadata = {
    title: "AI Analyst | Ministry",
};

export default function MinistryAiInsightPage() {
    return (
        <div className="flex-1 w-full bg-white relative">
            <AiInsightPageClient />
        </div>
    );
}
