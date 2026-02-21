import { Metadata } from "next";
import AiInsightPageClient from "@/features/ai/components/AiInsightPageClient";

export const metadata: Metadata = {
    title: "AI Analyst | Dean",
};

export default function DeanAiInsightPage() {
    return (
        <div className="flex-1 w-full bg-white relative">
            <AiInsightPageClient />
        </div>
    );
}
