// features/dashboard/advisor/components/StudentListTable.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StudentListItem } from "../hooks/useAdvisorStats";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eye } from "lucide-react";

interface Props {
  students: StudentListItem[];
}

export function StudentListTable({ students }: Props) {
  return (
    <Card className="col-span-4 border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle>รายชื่อนิสิตในที่ปรึกษา</CardTitle>
        <CardDescription>แสดงรายการนิสิตที่คุณดูแลอยู่ ({students.length} คน)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3">รหัสนิสิต</th>
                <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                <th className="px-4 py-3">คณะ</th>
                <th className="px-4 py-3">ความเสี่ยงล่าสุด</th>
                <th className="px-4 py-3">ความเคลื่อนไหวล่าสุด</th>
                <th className="px-4 py-3 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        ไม่พบข้อมูลนิสิต
                    </td>
                </tr>
              ) : (
                students.map((student) => (
                    <tr key={student.id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{student.code || "-"}</td>
                    <td className="px-4 py-3">{student.name}</td>
                    <td className="px-4 py-3 text-gray-500">{student.faculty || "-"}</td>
                    <td className="px-4 py-3">
                        <RiskBadge level={student.latestRisk} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                        {student.lastActivity 
                            ? new Date(student.lastActivity).toLocaleDateString("th-TH", {
                                day: 'numeric', month: 'short', year: 'numeric'
                            }) 
                            : "ยังไม่มีกิจกรรม"}
                    </td>
                    <td className="px-4 py-3 text-right">
                        <Link href={`/advisor/my-students/${student.id}`}>
                            <Button variant="outline" size="sm" className="h-8 gap-2">
                                <Eye className="w-3.5 h-3.5" />
                                ดูข้อมูล
                            </Button>
                        </Link>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskBadge({ level }: { level: number }) {
  let label = "ปกติ";
  let className = "bg-green-100 text-green-700";

  if (level >= 4) {
      label = "เสี่ยงสูง";
      className = "bg-red-100 text-red-700";
  } else if (level >= 2) {
      label = "เฝ้าระวัง";
      className = "bg-yellow-100 text-yellow-700";
  } else if (level === 0) {
      label = "ไม่มีข้อมูล";
      className = "bg-gray-100 text-gray-600";
  }

  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", className)}>
      {label}
    </span>
  );
}
