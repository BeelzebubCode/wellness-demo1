
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { BarChart3, Users } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import type { TeamMember } from "../hooks/useHeadConsultantDashboard";
import { cn } from "@/lib/cn";

interface Props {
    data: TeamMember[];
}

export function ConsultantPerformanceChart({ data }: Props) {
    // Sort and prepare data - limit for better spacing
    const chartData = [...data]
        .sort((a, b) => b.activeBookings - a.activeBookings)
        .slice(0, 6)
        .map(m => ({
            name: `${m.firstName}`,
            fullName: `${m.prefix}${m.firstName} ${m.lastName}`,
            value: m.activeBookings,
        }));

    const maxVal = Math.max(...chartData.map(d => d.value), 5);

    return (
        <Card className="col-span-1 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 rounded-xl bg-white flex flex-col h-full overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm text-white">
                        <BarChart3 className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900">
                        Workload สมาชิก
                    </CardTitle>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                    Top 6 Active
                </div>
            </CardHeader>

            <CardContent className="p-4 flex-1 h-[300px]">
                {chartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <Users className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-xs font-bold">ยังไม่มีข้อมูลการดูแล</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                            barSize={12}
                        >
                            <XAxis type="number" hide domain={[0, maxVal + 1]} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                                width={70}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(241, 245, 249, 0.5)', radius: 8 }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                    padding: '8px 12px',
                                    fontSize: '12px'
                                }}
                                labelStyle={{ fontWeight: 800, marginBottom: '4px', color: '#1e293b' }}
                                itemStyle={{ fontWeight: 700, color: 'rgb(var(--primary))' }}
                            />

                            {/* Background track for the bar */}
                            <Bar
                                dataKey={() => maxVal + 1}
                                fill="#f1f5f9"
                                radius={6}
                                isAnimationActive={false}
                            />

                            <Bar
                                dataKey="value"
                                radius={6}
                                animationDuration={1000}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill="rgb(var(--primary))"
                                        className="transition-all duration-300 hover:fill-primary-600"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>

            <div className="mt-auto px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Consultants</span>
                </div>
                <span className="text-[9px] font-bold text-slate-400">อัปเดตแบบเรียลไทม์</span>
            </div>
        </Card>
    );
}
