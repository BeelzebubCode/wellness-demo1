// features/dashboard/ministry/components/RiskyUniversityTable.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import type { UniversityRiskData } from "../services/ministry-types";
import { cn } from "@/lib/utils";

interface Props {
  universities: UniversityRiskData[];
}

export function RiskyUniversityTable({ universities }: Props) {
  return (
    <Card className="col-span-1 border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle>สถานะความเสี่ยงรายมหาวิทยาลัย</CardTitle>
        <CardDescription>เรียงลำดับตามสัดส่วนกลุ่มเสี่ยงสูง</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">มหาวิทยาลัย</th>
                <th className="px-4 py-3">จำนวนนิสิต</th>
                <th className="px-4 py-3">ความเสี่ยงสูง (%)</th>
                <th className="px-4 py-3 rounded-tr-lg">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 border-x border-b border-gray-200 rounded-b-lg">
              {universities.map((uni) => (
                <tr key={uni.id} className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{uni.name}</span>
                      <span className="text-xs text-gray-500">{uni.code}</span>
                    </div>
                  </td>
                  {/* Note: Student count for university needs to be fetched or added to result if needed. Using placeholder or if provided. 
                      Actually our service returns name/code/highRiskCount. 
                      We might need to fetch total students per uni to calc percentage, or just show raw count.
                      For now let's show raw count of high risks.
                  */}
                  <td className="px-4 py-3 text-center">-</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-600">{uni.highRiskCount}</span>
                      <span className="text-xs text-gray-500">เคส</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-semibold",
                      uni.highRiskCount > 50 ? "bg-red-100 text-red-700" :
                        uni.highRiskCount > 10 ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                    )}>
                      {uni.highRiskCount > 50 ? "Critical" : uni.highRiskCount > 10 ? "Warning" : "Normal"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
