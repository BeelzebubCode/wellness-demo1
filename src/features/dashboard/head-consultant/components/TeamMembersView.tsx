// features/dashboard/head-consultant/components/TeamMembersView.tsx
"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { User, Star, Briefcase, GraduationCap, ArrowRight, Activity } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TeamMember } from "../hooks/useHeadConsultantDashboard";

interface TeamMembersViewProps {
    team: TeamMember[];
    onSelectMember: (id: number) => void;
}

export function TeamMembersView({ team, onSelectMember }: TeamMembersViewProps) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {team.map((member) => (
                    <button
                        key={member.consultantId}
                        onClick={() => onSelectMember(member.consultantId)}
                        className="group text-left transition-all duration-300 hover:-translate-y-1"
                    >
                        <Card className="h-full border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-primary-200 transition-all overflow-hidden relative">
                            {/* Decorative background pulse for hover */}
                            <div className="absolute top-0 right-0 -m-8 h-24 w-24 rounded-full bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />

                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    {/* Avatar Circle */}
                                    <div className="relative">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-indigo-500 text-white shadow-lg text-xl font-bold">
                                            {member.firstName.charAt(0)}
                                        </div>
                                        {/* Active Status Badge */}
                                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-bold text-slate-800 truncate group-hover:text-primary-600 transition-colors">
                                            {member.prefix}{member.firstName} {member.lastName}
                                        </h4>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                            <span className="text-sm font-bold text-slate-600">
                                                {member.avgRating > 0 ? member.avgRating.toFixed(1) : "0.0"}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">
                                                ({member.feedbackCount.toLocaleString()} reviews)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100/50">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                                            <Briefcase className="h-3.5 w-3.5" />
                                            เคสที่ดูแล
                                        </div>
                                        <p className="text-lg font-black text-slate-900">{member.activeBookings}</p>
                                    </div>
                                    <div className="rounded-xl bg-blue-50 p-3 border border-blue-100/50">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-1">
                                            <Activity className="h-3.5 w-3.5" />
                                            อัตราสำเร็จ
                                        </div>
                                        <p className="text-lg font-black text-blue-700 uppercase">94%</p>
                                    </div>
                                </div>

                                {member.specializations.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            ความเชี่ยวชาญ
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {member.specializations.slice(0, 3).map((spec, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-600 border border-slate-200"
                                                >
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-primary-500 group-hover:text-primary-600">
                                    <span>ดูรายละเอียดและประวัติ</span>
                                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </button>
                ))}
            </div>
        </div>
    );
}
