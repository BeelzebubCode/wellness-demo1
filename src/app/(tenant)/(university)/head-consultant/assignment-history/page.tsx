// src/app/(tenant)/(university)/head-consultant/assignment-history/page.tsx
"use client";

import { useMemo, useState } from "react";
import { History, RotateCw } from "lucide-react";
import { FilterBar } from "@/components/filters/FilterBar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
    ADMIN_BOOKINGS_FILTER_DEFS,
    type AdminBookingsFilters,
} from "@/features/head-consultant/filters/defs";
import type { BookingStatus } from "@/features/head-consultant/bookings/types";
import { BookingsDashboard } from "@/features/head-consultant/bookings/components/BookingsDashboard";
import { useBookingsQuery } from "@/features/head-consultant/bookings/hook/useBookingsQuery";
import { useAssigneesQuery } from "@/features/head-consultant/bookings/hook/useAssigneesQuery";
import { useProblemCategoriesQuery } from "@/features/head-consultant/bookings/hook/useProblemCategoriesQuery";
import { useBookingActions } from "@/features/head-consultant/bookings/hook/useBookingActions";
import { toYMD, fromYMD } from "@/lib/date";

export default function AssignmentHistoryPage() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    // Default to ALL for history view, or ASSIGNED/COMPLETED to focus on what was assigned
    const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
    const [consultantId, setConsultantId] = useState<string>("");
    const [problemCategoryId, setProblemCategoryId] = useState<string>("");
    const [assignmentMethod, setAssignmentMethod] = useState<"ALL" | "MANUAL" | "AUTO">("ALL");
    const [search, setSearch] = useState("");

    const { rows, isLoading, error, refresh } = useBookingsQuery({
        date: selectedDate,
        status: statusFilter,
        consultantId: consultantId || undefined,
        problemCategoryId: problemCategoryId || undefined,
        assignmentMethod: assignmentMethod,
    });

    const { assignees, isLoading: isLoadingAssignees } = useAssigneesQuery(
        selectedDate ? toYMD(selectedDate) : undefined
    );
    const { categories } = useProblemCategoriesQuery();

    const { doAssign, doReschedule } = useBookingActions();

    // Filter out PENDING_ASSIGNMENT records as this is a History view
    const historyRows = useMemo(() => {
        return rows.filter(r => r.status && r.status !== "PENDING_ASSIGNMENT");
    }, [rows]);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return historyRows;

        return historyRows.filter((b) => {
            const user = String((b as any).userName ?? "").toLowerCase();
            const problem = String((b as any).problemType ?? "").toLowerCase();
            const detail = String((b as any).problemDescription ?? "").toLowerCase();
            return user.includes(q) || problem.includes(q) || detail.includes(q);
        });
    }, [historyRows, search]);

    const filterValue: AdminBookingsFilters = useMemo(
        () => ({
            date: selectedDate ? toYMD(selectedDate) : "",
            status: statusFilter as any,
            search,
            consultantId,
            problemCategoryId,
            assignmentMethod
        }),
        [selectedDate, statusFilter, search, consultantId, problemCategoryId, assignmentMethod],
    );

    const dynamicDefs = useMemo(() => {
        return ADMIN_BOOKINGS_FILTER_DEFS.map((def) => {
            if (def.key === "status") {
                return {
                    ...def,
                    options: [
                        { label: "ทั้งหมด", value: "ALL" },
                        { label: "มอบหมายแล้ว", value: "ASSIGNED" },
                        { label: "กำลังดำเนินการ", value: "IN_PROGRESS" },
                        { label: "เสร็จสิ้น", value: "COMPLETED" },
                        { label: "ยกเลิก", value: "CANCELLED" },
                    ]
                };
            }
            if (def.key === "consultantId") {
                return {
                    ...def,
                    options: [
                        { label: "ทั้งหมด", value: "" },
                        ...assignees.map((c) => ({ label: c.name, value: String(c.id) }))
                    ]
                };
            }
            if (def.key === "problemCategoryId") {
                return {
                    ...def,
                    options: [
                        { label: "ทั้งหมด", value: "" },
                        ...categories.map((c) => ({ label: c.nameTh, value: String(c.id) }))
                    ]
                };
            }
            return def;
        });
    }, [assignees, categories]);

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white shadow-sm ring-4 ring-primary-50">
                        <History className="h-5 w-5" />
                    </div>
                    <div>
                        <h5 className="text-2xl font-bold tracking-tight text-gray-900">ประวัติการแจกงาน</h5>
                        <p className="text-sm text-gray-500">ตรวจสอบประวัติการแจกงานแบบ Manual และ Auto</p>
                    </div>
                </div>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={refresh}
                    leftIcon={isLoading ? <Spinner /> : <RotateCw className="w-4 h-4" />}
                    className="shadow-sm bg-white hover:bg-gray-50"
                >
                    รีเฟรช
                </Button>
            </div>

            <FilterBar
                defs={dynamicDefs}
                value={filterValue}
                dateKey="date"
                searchKey="search"
                searchPlaceholder="ค้นหาชื่อ / ประเภทเรื่อง / รายละเอียด..."
                onChange={(next) => {
                    const nextDateStr = String((next as any).date ?? "").trim();
                    if (nextDateStr) setSelectedDate(fromYMD(nextDateStr));
                    else setSelectedDate(undefined);

                    setStatusFilter(((next as any).status ?? "ALL") as any);
                    setConsultantId(String((next as any).consultantId ?? ""));
                    setProblemCategoryId(String((next as any).problemCategoryId ?? ""));
                    setAssignmentMethod(((next as any).assignmentMethod ?? "ALL") as any);
                    setSearch(String((next as any).search ?? ""));
                }}
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <BookingsDashboard
                    selectedDate={selectedDate}
                    onChangeDate={setSelectedDate}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    rows={filteredRows}
                    isLoading={isLoading}
                    error={error}
                    assignees={assignees}
                    isLoadingAssignees={isLoadingAssignees}
                    onRefresh={refresh}
                    onAssign={async (bookingId, consultantId, borrowAssignmentId) => {
                        const row = rows.find((r) => r.id === bookingId);
                        if (!row) throw new Error("ไม่พบ booking ในรายการ");

                        await doAssign({
                            universityId: row.universityId,
                            bookingId,
                            consultantId,
                            borrowAssignmentId,
                        });
                    }}
                    onReschedule={async (bookingId, isoDateTime) => {
                        const row = rows.find((r) => r.id === bookingId);
                        if (!row) throw new Error("ไม่พบ booking ในรายการ");

                        const newTimeSlotId = Number(isoDateTime);
                        if (!Number.isFinite(newTimeSlotId)) {
                            throw new Error("ค่าเวลาที่ส่งมาไม่ใช่ timeSlotId (ตัวเลข)");
                        }

                        await doReschedule({
                            universityId: row.universityId,
                            bookingId,
                            newTimeSlotId,
                        });
                    }}
                />
            </div>
        </div>
    );
}
