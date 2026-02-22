import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAccountFromRequest } from "@/lib/auth/context";
import { AiFeedbackType, AiFeedbackStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { question, answer } = body;

        if (!question || typeof question !== "string") {
            return NextResponse.json({ valid: false, message: "question is required" }, { status: 400 });
        }

        // Try to get the current user session (optional)
        let accountId: number | null = null;
        let universityId: number | null = null;
        let userRole: string | null = null;

        try {
            const account = await getAccountFromRequest(request);
            if (account) {
                accountId = account.accountId ?? null;
                universityId = account.activeUniversityId ?? null;
                userRole = account.role ?? null;
            }
        } catch (sessionErr) {
            console.warn("[ai-feedback] session error (ignored):", sessionErr);
        }

        const feedback = await prisma.aiFeedbackEvent.create({
            data: {
                ai_feedback_type: AiFeedbackType.USER_NEGATIVE,
                ai_user_question_text: String(question).slice(0, 2000),
                ai_assistant_reply_excerpt: answer ? String(answer).slice(0, 500) : null,
                ai_feedback_status: AiFeedbackStatus.OPEN,
                account_id: accountId,
                university_id: universityId,
                ai_user_role: userRole,
            },
        });

        return NextResponse.json({ valid: true, data: { id: feedback.ai_feedback_event_id } });
    } catch (error: any) {
        console.error("[ai-feedback] POST error:", error?.message, error?.stack);
        return NextResponse.json({ valid: false, message: "Internal server error", detail: error?.message }, { status: 500 });
    }
}
