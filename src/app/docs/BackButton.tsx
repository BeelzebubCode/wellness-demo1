"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
    const router = useRouter();

    const handleBack = () => {
        // If opened in a new tab, history.length is typically 1 or 2
        if (window.history.length > 2) {
            router.back();
        } else {
            // No history — go to home
            router.push("/");
        }
    };

    return (
        <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-primary transition-colors"
        >
            <ArrowLeft className="w-3.5 h-3.5" />
            กลับหน้าก่อนหน้า
        </button>
    );
}
