import { ReactNode } from "react";
import { AlertCircle, BookOpen, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { getPublicDocs } from "@/services/document/handlers/publicDoc";

interface DocsPageProps {
    searchParams: { topic?: string };
}

export default async function DocsPage({ searchParams }: DocsPageProps) {
    const topic = searchParams.topic || "cancellation-policy";

    let docContent = null;
    try {
        const doc = await getPublicDocs(topic);
        docContent = doc as any;
    } catch (e) {
        // Document not found or error
    }

    if (!docContent) {
        return (
            <div className="max-w-4xl mx-auto py-16 px-6 lg:px-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">ไม่พบเอกสาร</h1>
                <p className="text-slate-500">
                    เอกสารที่คุณกำลังค้นหาอาจถูกลบ หรือยังไม่ได้เปิดให้บริการในขณะนี้
                </p>
                <Link href="/" className="mt-6 inline-block">
                    <Button variant="outline">กลับสู่หน้าหลัก</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-6 lg:px-12">
            <article className="prose prose-slate prose-headings:text-slate-900 max-w-none">
                <div className="border-b pb-4 mb-8 border-slate-200">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-primary-600" />
                        {docContent.document_title}
                    </h1>
                </div>

                <div
                    className="document-content"
                    dangerouslySetInnerHTML={{ __html: docContent.document_content }}
                />
            </article>
        </div>
    );
}
