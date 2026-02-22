"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { AlertBox } from "@/components/notification/AlertBox";
import { DocumentFormModal } from "@/features/document/components/DocumentFormModal";

interface Document {
    document_id: number;
    document_slug: string;
    document_title: string;
    document_is_active: boolean;
    document_order: number;
}

export default function SuperAdminDocsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocId, setEditingDocId] = useState<number | null>(null);

    const fetchDocs = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/v2/super-admin/docs");
            const json = await res.json();
            if (json.valid) {
                setDocuments(json.data);
            } else {
                setError(json.message || "Failed to load documents");
            }
        } catch (err) {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this document?")) return;

        try {
            const res = await fetch(`/api/v2/super-admin/docs?id=${id}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (json.valid) {
                fetchDocs();
            } else {
                alert(json.message || "Failed to delete");
            }
        } catch (err) {
            alert("Error deleting document");
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการหน้าเอกสาร (Document Management)</h1>
                    <p className="text-sm text-gray-500 mt-1">เพิ่ม ลบ แก้ไข ข้อมูลในหน้า /docs สำหรับให้ผู้ใช้งานอ่าน</p>
                </div>
                <Button onClick={() => { setEditingDocId(null); setIsModalOpen(true); }} className="gap-2">
                    <Plus className="w-4 h-4" /> เพิ่มเอกสารใหม่
                </Button>
            </div>

            {error && <AlertBox type="error" message={error} />}

            {loading ? (
                <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                            <tr>
                                <th className="px-6 py-3 font-semibold">ลำดับ</th>
                                <th className="px-6 py-3 font-semibold">ชื่อเอกสาร</th>
                                <th className="px-6 py-3 font-semibold">URL Slug</th>
                                <th className="px-6 py-3 font-semibold">สถานะ</th>
                                <th className="px-6 py-3 font-semibold text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {documents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        ยังไม่มีข้อมูลเอกสาร
                                    </td>
                                </tr>
                            ) : (
                                documents.map((doc) => (
                                    <tr key={doc.document_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">{doc.document_order}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{doc.document_title}</td>
                                        <td className="px-6 py-4 text-blue-600">/docs?topic={doc.document_slug}</td>
                                        <td className="px-6 py-4">
                                            {doc.document_is_active ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                                                    <Eye className="w-3 h-3" /> แสดงผล
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                                    <EyeOff className="w-3 h-3" /> ซ่อน
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => { setEditingDocId(doc.document_id); setIsModalOpen(true); }}
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(doc.document_id)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <DocumentFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    documentId={editingDocId}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchDocs();
                    }}
                />
            )}
        </div>
    );
}
