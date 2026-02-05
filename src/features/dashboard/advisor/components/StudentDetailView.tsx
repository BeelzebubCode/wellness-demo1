"use client";

import { useEffect, useState } from "react";
import type { AccountRole } from "@prisma/client";
import { getStudentDetail } from "../actions";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";
import { LoadingSpinner, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, User, Phone, Mail, MapPin, AlertTriangle, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

interface Props {
  studentId: number;
}

export function StudentDetailView({ studentId }: Props) {
  const { user } = useRoleAuth({ allowedRoles: ["ADVISOR" as AccountRole] });
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetch() {
      setIsLoading(true);
      try {
        const data = await getStudentDetail(user!, studentId);
        setStudent(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [user, studentId]);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">ไม่พบข้อมูลนิสิต</h2>
        <p className="text-gray-500 mt-2">นิสิตนี้อาจไม่ได้อยู่ในความดูแลของคุณ</p>
        <Link href="/advisor/my-students" className="mt-4 inline-block">
          <Button variant="outline">กลับหน้ารายชื่อ</Button>
        </Link>
      </div>
    );
  }

  const profile = student.profile;
  const academic = student.academic;
  const bookings = student.bookings || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/advisor/my-students">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
           <h1 className="text-2xl font-bold text-gray-900">
             {profile?.student_first_name_th} {profile?.student_last_name_th}
           </h1>
           <div className="text-gray-500 text-sm">รหัส {student.student_code}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1 h-fit">
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-lg">
               <User className="w-5 h-5 text-indigo-600" />
               ข้อมูลส่วนตัว
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div>
                <div className="text-sm font-medium text-gray-500">คณะ/สาขา</div>
                <div className="text-sm">{academic?.faculty?.faculty_name_th}</div>
                <div className="text-sm text-gray-600">{academic?.department?.department_name_th}</div>
             </div>
             
             <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                   <Phone className="w-4 h-4" />
                   {profile?.student_phone_number || "-"}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                   <Mail className="w-4 h-4" />
                   {profile?.student_email || "-"}
                </div>
             </div>

             {student.addresses?.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span className="text-xs">
                            {student.addresses[0].student_address_detail}, {student.addresses[0].province?.province_name_th}
                        </span>
                    </div>
                </div>
             )}
           </CardContent>
        </Card>

        {/* Clinical History */}
        <div className="md:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                ประวัติการเข้ารับคำปรึกษา
            </h2>

            {bookings.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                    ยังไม่มีประวัติการเข้ารับคำปรึกษา
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking: any) => (
                        <Card key={booking.booking_id} className="border border-gray-100 hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900">
                                                {booking.problemCategory?.problem_category_name_th || "ปรึกษาทั่วไป"}
                                            </span>
                                            <Badge variant={booking.booking_status === "COMPLETED" ? "default" : "secondary"}>
                                                {booking.booking_status}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(booking.timeSlot?.time_slot_start_datetime || booking.booking_created_at).toLocaleString("th-TH")}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-2">
                                            ผู้ให้คำปรึกษา: {booking.consultant?.profile?.consultant_first_name_th || "ไม่ระบุ"}
                                        </div>
                                    </div>
                                    
                                    {/* Risk Outcome */}
                                    {booking.outcome?.booking_outcome_risk_level > 0 && (
                                        <div className="flex flex-col items-end">
                                            <div className="text-xs text-gray-500 mb-1">ระดับความเสี่ยง</div>
                                            <RiskLevelBadge level={booking.outcome.booking_outcome_risk_level} />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function RiskLevelBadge({ level }: { level: number }) {
    let color = "bg-gray-100 text-gray-600";
    let label = "ปกติ";

    if (level >= 4) {
        color = "bg-red-100 text-red-700 font-bold";
        label = "สูง (High)";
    } else if (level === 3) {
        color = "bg-orange-100 text-orange-700";
        label = "ปานกลาง (Medium)";
    } else if (level <= 2) {
        color = "bg-green-100 text-green-700";
        label = "ต่ำ (Low)";
    }

    return (
        <span className={`px-3 py-1 rounded-full text-xs ${color} flex items-center gap-1`}>
            {level >= 4 && <AlertTriangle className="w-3 h-3" />}
            {label}
        </span>
    );
}
