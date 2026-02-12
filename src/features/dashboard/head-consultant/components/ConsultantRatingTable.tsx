
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { Star, MessageSquareQuote, ChevronRight, Award } from "lucide-react";
import type { ConsultantRating } from "../hooks/useHeadConsultantDashboard";
import { cn } from "@/lib/cn";

interface Props {
    ratings: ConsultantRating[];
}

function StarRating({ score, max = 5 }: { score: number; max?: number }) {
    return (
        <div className="flex items-center gap-0.5" title={`${score} / ${max}`}>
            {Array.from({ length: max }, (_, i) => {
                const filled = score >= i + 0.8;
                return (
                    <Star
                        key={i}
                        className={cn(
                            "h-3 w-3",
                            filled
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200 fill-slate-50"
                        )}
                    />
                );
            })}
        </div>
    );
}

export function ConsultantRatingTable({ ratings }: Props) {
    const sorted = [...ratings].sort((a, b) => b.avgRating - a.avgRating);

    return (
        <Card className="col-span-1 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 rounded-xl bg-white flex flex-col h-full overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm text-white shrink-0">
                    <Award className="h-4 w-4" />
                </div>
                <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                        ระดับความพึงพอใจ
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-slate-500">
                        คะแนนรวมจากแบบประเมิน
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="p-3 flex-1 overflow-hidden flex flex-col">
                {sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                        <Star className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-xs font-bold">ยังไม่มีข้อมูลการประเมิน</p>
                    </div>
                ) : (
                    <div className="space-y-1.5 h-[500px] overflow-y-auto custom-scrollbar pr-1">
                        {sorted.map((c) => (
                            <div
                                key={c.consultantId}
                                className="group flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all cursor-default"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                        {c.firstName.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-primary transition-colors">
                                            {c.prefix}{c.firstName} {c.lastName}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <StarRating score={c.avgRating} />
                                            <span className="text-[10px] font-bold text-slate-900">
                                                {c.avgRating.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 group-hover:bg-white transition-colors">
                                        <MessageSquareQuote className="w-3 h-3 text-slate-400 group-hover:text-primary" />
                                        <span className="text-[10px] font-bold text-slate-700">
                                            {c.feedbackCount.toLocaleString()}
                                        </span>
                                    </div>
                                    {c.avgRating >= 4.5 && (
                                        <div className="text-[8px] font-black uppercase text-primary bg-primary/10 px-1.5 py-0 rounded">
                                            TOP
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <div className="mt-auto px-4 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">REALTIME</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
            </div>
        </Card>
    );
}
