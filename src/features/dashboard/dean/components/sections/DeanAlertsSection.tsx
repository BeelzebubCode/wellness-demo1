"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { AlertTriangle, TrendingUp, Users, ShieldAlert, CheckCircle } from "lucide-react";

interface DeanAlertsSectionProps {
    stats: {
        riskDistribution: { HIGH: number; MEDIUM: number; LOW: number; NORMAL: number };
        repeatStats: { single: number; repeat: number };
        visitTrend: string;
        totalStudents: number;
        activeCases: number;
    };
}

export function DeanAlertsSection({ stats }: DeanAlertsSectionProps) {
    const totalRisks = stats.riskDistribution.HIGH + stats.riskDistribution.MEDIUM + stats.riskDistribution.LOW + stats.riskDistribution.NORMAL;
    const highRiskPercent = totalRisks > 0 ? (stats.riskDistribution.HIGH / totalRisks) * 100 : 0;

    const totalVisits = stats.repeatStats.single + stats.repeatStats.repeat;
    const repeatPercent = totalVisits > 0 ? (stats.repeatStats.repeat / totalVisits) * 100 : 0;

    const visitTrendVal = parseFloat(stats.visitTrend);

    const alerts = [];

    // 1. High Risk Alert
    if (highRiskPercent > 15) {
        alerts.push({
            title: "กลุ่มเสี่ยงสูงมีสัดส่วนมากผิดปกติ",
            description: `พบกลุ่มเสี่ยงสูงถึง ${highRiskPercent.toFixed(1)}% ของผู้รับบริการทั้งหมด อาจบ่งชี้ถึงปัญหาวิกฤตในคณะ`,
            status: "critical",
            icon: <ShieldAlert className="h-5 w-5 text-red-500" />
        });
    } else if (highRiskPercent > 10) {
        alerts.push({
            title: "เฝ้าระวังกลุ่มเสี่ยงสูง",
            description: `สัดส่วนกลุ่มเสี่ยงสูงเริ่มเพิ่มขึ้น (${highRiskPercent.toFixed(1)}%) ควรเตรียมทีมดูแลให้พร้อม`,
            status: "warning",
            icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
        });
    }

    // 2. Workload / Trend Alert
    if (visitTrendVal > 30) {
        alerts.push({
            title: "ยอดผู้ใช้บริการพุ่งสูงขึ้นมาก",
            description: `เพิ่มขึ้น ${visitTrendVal}% จากเดือนก่อนหน้า อาจทำให้นักจิตบำบัดดูแลไม่ทั่วถึง`,
            status: "warning",
            icon: <TrendingUp className="h-5 w-5 text-orange-500" />
        });
    }

    // 3. Repeat Rate Alert (Chronic issues)
    if (repeatPercent > 60) {
        alerts.push({
            title: "สัดส่วนการกลับมาซ้ำสูง",
            description: `นิสิตกว่า ${repeatPercent.toFixed(0)}% กลับมาใช้บริการซ้ำ บ่งชี้ปัญหาเรื้อรังที่ต้องแก้ไขระยะยาว`,
            status: "info",
            icon: <Users className="h-5 w-5 text-blue-500" />
        });
    }

    // Default Good News if no alerts
    if (alerts.length === 0) {
        alerts.push({
            title: "สถานการณ์ปกติ",
            description: "ภาพรวมดูเรียบร้อยดี ไม่พบดัชนีชี้วัดที่น่ากังวลเป็นพิเศษในขณะนี้",
            status: "good",
            icon: <CheckCircle className="h-5 w-5 text-emerald-500" />
        });
    }

    return (
        <div className="space-y-6 pt-6 border-t border-slate-200">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-900">
                    สรุปประเด็นเพื่อการตัดสินใจ
                </h2>
                <p className="text-slate-500 text-sm">
                    Insight อัตโนมัติจากข้อมูลปัจจุบัน
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {alerts.map((alert, idx) => (
                    <Card key={idx} className={`border-none shadow-sm ${alert.status === 'critical' ? 'bg-red-50' :
                        alert.status === 'warning' ? 'bg-orange-50' :
                            alert.status === 'good' ? 'bg-emerald-50' : 'bg-blue-50'
                        }`}>
                        <CardContent className="flex items-start gap-4 p-5">
                            <div className="mt-1 p-2 bg-white rounded-lg shadow-sm">
                                {alert.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-bold ${alert.status === 'critical' ? 'text-red-900' :
                                    alert.status === 'warning' ? 'text-orange-900' :
                                        alert.status === 'good' ? 'text-emerald-900' : 'text-blue-900'
                                    }`}>
                                    {alert.title}
                                </h3>
                                <p className={`text-sm mt-1 ${alert.status === 'critical' ? 'text-red-700' :
                                    alert.status === 'warning' ? 'text-orange-700' :
                                        alert.status === 'good' ? 'text-emerald-700' : 'text-blue-700'
                                    }`}>
                                    {alert.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Decision Support Box */}
            <div className="px-6 py-5 bg-slate-900 rounded-2xl text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">คำแนะนำเบื้องต้น (AI Recommendation)</h4>
                        <p className="text-slate-400 text-xs">Based on {stats.activeCases} active cases</p>
                    </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                    {highRiskPercent > 10
                        ? "“กลุ่มเสี่ยงสูงมีแนวโน้มเพิ่มขึ้น ควรพิจารณาประสานงานอาจารย์ที่ปรึกษาให้ช่วยสอดส่องดูแลดูแลนิสิตอย่างใกล้ชิด”"
                        : visitTrendVal > 20
                            ? "“จำนวนผู้ใช้บริการเพิ่มขึ้นอย่างรวดเร็ว ควรตรวจสอบตารางงานของผู้เชี่ยวชาญว่ารองรับเพียงพอหรือไม่”"
                            : "“สถานการณ์โดยรวมปกติดี ควรรักษามาตรฐานการให้บริการและการติดตามผลอย่างต่อเนื่อง”"
                    }
                </p>
            </div>
        </div>
    );
}
