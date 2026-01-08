"use client";

import { Card, Button } from "@/components/ui";
import {
  ClipboardList,
  Clock3,
  CalendarDays,
  UserRound,
  CheckCircle,
} from "lucide-react";

/* ---------------- MOCK DATA ---------------- */
const mockSchedules = [
  {
    id: 1,
    date: "9 มกราคม 2569",
    time: "08:00 - 09:00 น.",
    studentName: "student1",
    category: "การวางแผนอาชีพ",
    status: "upcoming",
  },
  {
    id: 2,
    date: "9 มกราคม 2569",
    time: "10:00 - 11:00 น.",
    studentName: "student2",
    category: "ปัญหาการเรียน",
    status: "completed",
  },
];

export default function ConsultantSchedulePage() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* TITLE */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary-600" />
          ตารางนัดให้คำปรึกษา
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          ดูรายการนัดหมายที่ต้องให้คำปรึกษา
        </p>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SCHEDULE LIST */}
        <div className="lg:col-span-2 space-y-4">
          {mockSchedules.map((item) => (
            <Card
              key={item.id}
              className="rounded-2xl p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <CalendarDays className="w-4 h-4 text-primary-500" />
                    {item.date}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock3 className="w-4 h-4 text-emerald-600" />
                    {item.time}
                  </div>

                  <div className="mt-2 text-sm bg-gray-100 rounded-lg px-3 py-2 inline-block">
                    ประเภทปัญหา:{" "}
                    <span className="font-medium text-gray-800">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <UserRound className="w-4 h-4" />
                    {item.studentName}
                  </div>
                </div>

                <div>
                  {item.status === "upcoming" ? (
                    <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                      รอให้คำปรึกษา
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      เสร็จสิ้น
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm">
                  ดูรายละเอียด
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* SUMMARY */}
        <div className="space-y-4">
          <Card className="rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary-500" />
              สรุปตารางงาน
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>นัดหมายทั้งหมด</span>
                <span className="font-semibold text-gray-800">
                  {mockSchedules.length} รายการ
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>วันนี้</span>
                <span className="font-semibold text-gray-800">
                  {
                    mockSchedules.filter(
                      (s) => s.status === "upcoming"
                    ).length
                  }{" "}
                  รายการ
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
