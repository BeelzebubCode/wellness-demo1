"use client";

export default function HeadDepartmentAiInsightPage() {
    return (
        <div className="flex-1 flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-2xl mx-auto">
                        🤖
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800">AI สรุปผลภาควิชา</h2>
                    <p className="text-slate-500 text-sm max-w-sm">
                        ระบบ AI วิเคราะห์ข้อมูลสุขภาวะในระดับภาควิชา กำลังพัฒนา
                    </p>
                </div>
            </div>
        </div>
    );
}
