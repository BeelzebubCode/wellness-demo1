// features/dashboard/dean/components/DeanStatsCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Users, Calendar, AlertCircle } from "lucide-react";

interface DeanStats {
    totalStudents: number;
    totalBookings: number;
    riskDistribution: {
        HIGH: number;
        MEDIUM: number;
        LOW: number;
        NORMAL: number;
    };
    facultyName: string;
}

interface Props {
    stats: DeanStats;
}

export function DeanStatsCards({ stats }: Props) {
    const highRiskCount = stats.riskDistribution.HIGH;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">นิสิตในคณะ</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalStudents}</div>
                    <p className="text-xs text-muted-foreground">คน</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">เคสทั้งหมด</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalBookings}</div>
                    <p className="text-xs text-muted-foreground">รายการ</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ความเสี่ยงสูง</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{highRiskCount}</div>
                    <p className="text-xs text-muted-foreground">เคสที่ต้องจับตาดู</p>
                </CardContent>
            </Card>
        </div>
    );
}
