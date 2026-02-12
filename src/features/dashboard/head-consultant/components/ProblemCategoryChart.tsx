
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { FolderKanban } from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import type { CategoryItem } from "../hooks/useHeadConsultantDashboard";

const COLORS = [
    "rgb(var(--primary))",
    "rgb(var(--primary-600))",
    "rgb(var(--accent))",
    "rgba(var(--primary), 0.7)",
    "rgba(var(--primary-600), 0.7)",
    "rgba(var(--accent), 0.7)",
    "rgba(var(--primary), 0.4)",
    "rgba(var(--primary-600), 0.4)",
];

interface Props {
    categories: CategoryItem[];
}

export function ProblemCategoryChart({ categories }: Props) {
    const chartData = categories.slice(0, 8).map(c => ({
        name: c.nameTh,
        value: c.count
    }));

    return (
        <Card className="col-span-1 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 rounded-xl bg-white flex flex-col h-full overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm text-white shrink-0">
                    <FolderKanban className="h-4 w-4" />
                </div>
                <div>
                    <CardTitle className="text-base font-bold text-slate-900">ประเภทปัญหา</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Problem Categories</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 h-[300px]">
                {chartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <FolderKanban className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-xs font-bold">ยังไม่มีข้อมูล</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-white stroke-2" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                                itemStyle={{ fontWeight: 700 }}
                            />
                            <Legend
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '11px', fontWeight: 700, fill: '#64748b', paddingLeft: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
            <div className="mt-auto px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Metric: Cumulative Counts</span>
                <div className="h-1.5 w-1.5 rounded-full bg-primary/20" />
            </div>
        </Card>
    );
}
