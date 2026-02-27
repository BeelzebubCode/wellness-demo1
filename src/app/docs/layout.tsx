// src/app/docs/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { Metadata } from "next";
import { getPublicDocs } from "@/services/document/handlers/publicDoc";
import { BackButton } from "./BackButton";

export const metadata: Metadata = {
    title: "เอกสารอ้างอิงและคู่มือ (Document) | NU Wellness",
    description: "รวบรวมเอกสารคู่มือการใช้งาน เงื่อนไขการรับบริการ และนโยบายต่างๆ",
};

export default async function DocsLayout({ children }: { children: ReactNode }) {
    let menuItems: any[] = [];
    try {
        const docs = await getPublicDocs();
        if (Array.isArray(docs)) {
            menuItems = docs.map((doc: any) => ({
                id: doc.document_slug,
                label: doc.document_title,
                icon: FileText
            }));
        }
    } catch (e) {
        // Fallback or empty if DB fails
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 md:min-h-screen shrink-0">
                <div className="p-4 md:p-6 border-b border-slate-100 sticky top-0 bg-white z-10 space-y-3">
                    <BackButton />
                    <Link href="/" className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-bold">คู่มือและการใช้งาน</span>
                    </Link>
                </div>
                <div className="p-4">
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
                        หัวข้อช่วยเหลือ
                    </h2>
                    <nav className="space-y-1">
                        {menuItems.length > 0 ? (
                            menuItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/docs?topic=${item.id}`}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <item.icon className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                                        <span className="truncate">{item.label}</span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary-500 shrink-0" />
                                </Link>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-slate-400">ยังไม่มีเอกสารในระบบ</div>
                        )}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden pt-4 md:pt-0">
                {children}
            </main>
        </div>
    );
}
