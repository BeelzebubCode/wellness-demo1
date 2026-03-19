"use client";

import { useEffect, useState } from "react";

import { getStudentDetail } from "../actions";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";


import {
  LoadingSpinner,
  Card,
  CardContent,
} from "@/components/ui";
import { Button } from "@/components/ui/Button";

import {
  ChevronLeft,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  AlertTriangle,
} from "lucide-react";

import Link from "next/link";

interface Props {
  studentId: number;
}

export function StudentDetailView({ studentId }: Props) {
  /* ================= Auth ================= */
  const { user } = useRoleAuth({
    allowedRoles: ["ADVISOR"],
    loginToastKey: "advisor-student-detail",
  });

  /* ================= State ================= */
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ================= Pagination (ต้องอยู่บนสุด) ================= */
  const PAGE_SIZE = 7;
  const [currentPage, setCurrentPage] = useState(1);

  /* ================= Fetch ================= */
  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      try {
        setIsLoading(true);
        const data = await getStudentDetail(user, studentId);
        setStudent(data);
        setCurrentPage(1); // reset หน้าเมื่อเปลี่ยนนิสิต
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [user, studentId]);

  /* ================= Early Return ================= */
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">ไม่พบข้อมูลนิสิต</h2>
        <p className="text-gray-500 mt-2">
          นิสิตนี้อาจไม่ได้อยู่ในความดูแลของคุณ
        </p>
        <Link href="/advisor/my-students">
          <Button variant="outline" className="mt-4">
            กลับหน้ารายชื่อ
          </Button>
        </Link>
      </div>
    );
  }

  /* ================= Data ================= */
  const profile = student.profile;
  const academic = student.academic;
  const bookings = student.bookings ?? [];

  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
  const paginatedBookings = bookings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      {/* ===== Back ===== */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/advisor/my-students">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <span>กลับหน้ารายชื่อ</span>
      </div>

      {/* ===== Layout ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">

        {/* ================= Profile ================= */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2 text-gray-800">
            <User className="w-5 h-5 text-indigo-500" />
            ข้อมูลส่วนตัว
          </h2>

          <Card className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur shadow-sm">
            <CardContent className="p-5 text-sm text-gray-700 space-y-4">
              {/* ชื่อ */}
              <div className="space-y-0.5">
                <div className="text-base font-semibold text-gray-900">
                  {profile?.student_first_name_th} {profile?.student_last_name_th}
                </div>
                <div className="text-sm text-gray-500">
                  รหัสนิสิต {student.student_code}
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                {/* คณะ / สาขา */}
                <div className="space-y-0.5">
                  <div className="text-sm text-gray-500">คณะ / สาขา</div>
                  <div className="text-sm font-medium text-gray-800">
                    {academic?.faculty?.faculty_name_th}
                  </div>
                  <div className="text-sm text-gray-700">
                    {academic?.department?.department_name_th}
                  </div>
                </div>

                {/* โทร */}
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FiPhone className="w-4 h-4 text-indigo-400" />
                  <span>{profile?.student_phone_number || "-"}</span>
                </div>

                {/* อีเมล */}
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FiMail className="w-4 h-4 text-indigo-400" />
                  <span>{profile?.student_email || "-"}</span>
                </div>

                {/* ที่อยู่ */}
                {student.addresses?.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <FiMapPin className="w-4 h-4 text-indigo-400 mt-0.5" />
                    <span>
                      {student.addresses[0].student_address_detail},{" "}
                      {student.addresses[0].province?.province_name_th}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= History ================= */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2 text-gray-800">
            <FileText className="w-5 h-5 text-indigo-500" />
            ประวัติการเข้ารับคำปรึกษา
          </h2>

          {bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-gray-500">
              ยังไม่มีประวัติการเข้ารับคำปรึกษา
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedBookings.map((booking: any) => (
                  <Card
                    key={booking.booking_id}
                    className="rounded-xl border border-gray-100 bg-white"
                  >
                    <CardContent className="px-4 py-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.problemCategory?.problem_category_name_th ||
                              "ปรึกษาทั่วไป"}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(
                              booking.timeSlot?.time_slot_start_datetime ??
                                booking.booking_created_at
                            ).toLocaleString("th-TH")}
                          </div>
                        </div>

                        {booking.outcome?.risk_level_id && (
                          <RiskLevelBadge
                            level={booking.outcome.risk_level_id}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ===== Pagination ===== */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6">
                  {/* ===== Previous ===== */}
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={`
                      px-4 h-9 rounded-xl border text-sm font-medium
                      transition-all
                      ${
                        currentPage === 1
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    Previous
                  </button>

                  {/* ===== Page Numbers ===== */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const page = i + 1;
                      const isActive = page === currentPage;

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`
                            min-w-[36px] h-9 px-3
                            rounded-xl text-sm font-medium
                            transition-all
                            ${
                              isActive
                                ? "bg-orange-500 text-white shadow-md"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-orange-50"
                            }
                          `}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* ===== Next ===== */}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className={`
                      px-4 h-9 rounded-xl border text-sm font-medium
                      transition-all
                      ${
                        currentPage === totalPages
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= Risk Badge ================= */

function RiskLevelBadge({ level }: { level: number }) {
  let label = "ต่ำ (Low)";
  let color = "bg-green-100 text-green-700";

  if (level === 3) {
    label = "ปานกลาง (Medium)";
    color = "bg-orange-100 text-orange-700";
  }

  if (level >= 4) {
    label = "สูง (High)";
    color = "bg-red-100 text-red-700 font-semibold";
  }

  return (
    <div
      className={`px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 ${color}`}
    >
      {level >= 4 && <AlertTriangle className="w-3 h-3" />}
      {label}
    </div>
  );
}
