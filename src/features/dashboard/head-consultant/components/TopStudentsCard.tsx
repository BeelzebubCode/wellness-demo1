
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Trophy, Medal, Crown } from "lucide-react";
import type { TopStudent } from "../hooks/useHeadConsultantDashboard";
import { cn } from "@/lib/cn";

interface Props {
    students: TopStudent[];
}

export function TopStudentsCard({ students }: Props) {
    const topThree = students.slice(0, 3);
    const others = students.slice(3, 10);

    const getRankStyles = (index: number) => {
        switch (index) {
            case 0: return {
                bg: "bg-amber-50/50",
                border: "border-amber-200",
                iconContainer: "bg-amber-500",
                accentText: "text-amber-700"
            };
            case 1: return {
                bg: "bg-slate-50/50",
                border: "border-slate-200",
                iconContainer: "bg-slate-400",
                accentText: "text-slate-700"
            };
            case 2: return {
                bg: "bg-orange-50/50",
                border: "border-orange-200",
                iconContainer: "bg-orange-400",
                accentText: "text-orange-700"
            };
            default: return null;
        }
    };

    return (
        <Card className="col-span-1 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 rounded-xl bg-white flex flex-col h-full overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm text-white shrink-0">
                    <Trophy className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                    นิสิตคะแนนสูงสุด
                </CardTitle>
            </CardHeader>

            <CardContent className="p-3 flex-1 flex flex-col gap-2 overflow-hidden">
                {students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                        <Trophy className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-xs font-bold">ยังไม่มีข้อมูลคะแนน</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 h-full overflow-hidden">
                        {/* Top 3 Compact List */}
                        <div className="grid gap-2">
                            {topThree.map((student, idx) => {
                                const style = getRankStyles(idx);
                                if (!style) return null;
                                return (
                                    <div
                                        key={student.studentId}
                                        className={cn(
                                            "flex items-center justify-between p-2.5 rounded-lg border transition-all",
                                            style.bg,
                                            style.border
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 flex items-center justify-center rounded-lg shadow-sm text-white shrink-0",
                                                style.iconContainer
                                            )}>
                                                {idx === 0 ? <Crown className="w-5 h-5" /> : <Medal className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-slate-900 truncate">
                                                    {student.firstName} {student.lastName}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400 truncate">
                                                    ID: {student.studentCode || student.username}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <div className={cn("text-base font-black tabular-nums leading-none", style.accentText)}>
                                                {student.points.toLocaleString()}
                                            </div>
                                            <div className="text-[9px] font-bold uppercase text-slate-400">Pts</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Others List - Tightened */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-0.5">
                            {others.map((student, idx) => (
                                <div
                                    key={student.studentId}
                                    className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors group cursor-default"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-6 text-center text-[10px] font-bold text-slate-400 group-hover:text-slate-900 shrink-0">
                                            #{idx + 4}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-xs text-slate-700 group-hover:text-slate-900 truncate">
                                                {student.firstName} {student.lastName}
                                            </p>
                                            <p className="text-[9px] text-slate-400 font-medium">
                                                {student.studentCode || student.username}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 group-hover:bg-white shrink-0 ml-2">
                                        <span className="text-[10px] font-bold text-slate-800">
                                            {student.points.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>

            <div className="mt-auto px-4 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                <span className="text-[9px] font-bold text-slate-400">เลื่อนดูอันดับทั้งหมด</span>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
            </div>
        </Card>
    );
}
