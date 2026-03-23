// src/features/dashboard/super-admin/components/SystemOverviewCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { getSystemOverview } from "../actions";
import {
    Server, Database, BookOpen, Handshake, Users,
    MessageSquare, CheckCircle, Clock, XCircle
} from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";

type SystemData = Awaited<ReturnType<typeof getSystemOverview>>;

export function SystemOverviewCard({ delay = 0 }: { delay?: number }) {
    const [data, setData] = useState<SystemData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await getSystemOverview();
                setData(res);
            } catch (err) {
                console.error("Failed to fetch system overview", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <DataStoryCard
            icon={<Server className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-slate-700 to-slate-900"
            title="System Infrastructure"
            description="สถานะทรัพยากรส่วนกลางของระบบ"
            narration="ภาพรวมเอกสาร แผนการทำงานส่วนกลาง คำขอยืมตัวที่ปรึกษาจากทุกมหาวิทยาลัย และระบบฐานข้อมูล"
            loading={loading}
            delay={delay}
        >
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                    {/* System Health */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 mb-3 text-slate-600">
                            <Database className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Database Status</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xl font-black text-slate-800">{data.systemHealth}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Uptime {data.uptime}</p>
                    </div>

                    {/* Consultants Base */}
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-3 text-blue-600">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Consultants</span>
                        </div>
                        <span className="text-xl font-black text-slate-800">{data.totalConsultants.toLocaleString()}</span>
                        <p className="text-xs text-slate-500 mt-1">บุคลากรทั้งหมดในระบบ</p>
                    </div>

                    {/* Knowledge Base */}
                    <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-center gap-2 mb-3 text-purple-600">
                            <BookOpen className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Knowledge Base</span>
                        </div>
                        <span className="text-xl font-black text-slate-800">{data.kbDocuments.toLocaleString()}</span>
                        <p className="text-xs text-slate-500 mt-1">เอกสาร Active ในระบบ</p>
                    </div>

                    {/* Feedback */}
                    <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                        <div className="flex items-center gap-2 mb-3 text-amber-600">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Feedback Answers</span>
                        </div>
                        <span className="text-xl font-black text-slate-800">{data.totalFeedbacks.toLocaleString()}</span>
                        <p className="text-xs text-slate-500 mt-1">แบบประเมินทั้งหมด</p>
                    </div>

                    {/* Borrow Requests Pipeline (Spans full width) */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-orange-50/40 rounded-xl p-5 border border-orange-100 mt-2">
                        <div className="flex items-center gap-2 mb-4 text-orange-600">
                            <Handshake className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Borrow Request Pipeline</span>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">รวมคำขอทั้งหมด</p>
                                <p className="text-2xl font-black text-slate-800">{data.borrowRequests.total}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> รอตรวจสอบ (Submitted)
                                </p>
                                <p className="text-2xl font-black text-slate-800">{data.borrowRequests.pending}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> อนุมัติแล้ว (Approved)
                                </p>
                                <p className="text-2xl font-black text-slate-800">{data.borrowRequests.approved}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> ปฏิเสธ (Rejected)
                                </p>
                                <p className="text-2xl font-black text-slate-800">{data.borrowRequests.rejected}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DataStoryCard>
    );
}
