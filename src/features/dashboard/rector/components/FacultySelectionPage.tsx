// src/features/dashboard/dean/components/FacultySelectionPage.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Building2, Users, GraduationCap, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useFaculties } from "../hooks/useFaculties";
import type { Faculty } from "../types";

export function FacultySelectionPage() {
    const { faculties, isLoading, error } = useFaculties();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // Show 12 faculties per page

    // Filter faculties
    const filteredFaculties = faculties.filter((faculty) => {
        const matchesSearch =
            faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faculty.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faculty.nameEn?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredFaculties.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentFaculties = filteredFaculties.slice(startIndex, endIndex);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-gray-600 font-semibold">Loading faculties...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 font-semibold mb-2">Error loading faculties</div>
                    <div className="text-gray-600">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Faculty Dashboard</h1>
                <p className="text-gray-600">Select a faculty to view detailed statistics</p>
            </div>

            {/* Search */}
            <div className="max-w-7xl mx-auto mb-6 bg-white rounded-2xl shadow-lg p-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by faculty name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Results Count */}
            <div className="max-w-7xl mx-auto mb-4 flex justify-between items-center">
                <p className="text-gray-600">
                    Showing{" "}
                    <span className="font-semibold text-indigo-600">
                        {startIndex + 1}-{Math.min(endIndex, filteredFaculties.length)}
                    </span>{" "}
                    of <span className="font-semibold text-indigo-600">{filteredFaculties.length}</span>{" "}
                    faculties
                </p>
                {totalPages > 1 && (
                    <p className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                    </p>
                )}
            </div>

            {/* Faculty Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentFaculties.map((faculty) => {
                    const logoUrl = faculty.logo || `/images/logo/${faculty.universityCode}_logo.png`;

                    return (
                        <Link
                            key={faculty.id}
                            href={`/dean/faculties/${faculty.code}`}
                            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-indigo-400"
                        >
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 flex items-center justify-center border-b border-gray-100">
                                <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center p-2 relative">
                                    <Image
                                        src={logoUrl}
                                        alt={faculty.code}
                                        width={80}
                                        height={80}
                                        className="object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = "none";
                                            const parent = (e.target as HTMLImageElement).parentElement;
                                            if (parent) {
                                                parent.innerHTML = `<div class="text-2xl font-bold text-indigo-600">${faculty.code}</div>`;
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    {faculty.name}
                                </h3>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                        {faculty.universityName}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        {faculty.studentCount.toLocaleString()} students
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <GraduationCap className="w-4 h-4 text-gray-400" />
                                        {faculty.departmentCount} departments
                                    </div>
                                </div>

                                {faculty.educationFieldGroup && (
                                    <div className="mb-4">
                                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide bg-indigo-50 px-2 py-1 rounded">
                                            {faculty.educationFieldGroup}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between">
                        {/* Previous Button */}
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${currentPage === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg"
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                // Show first page, last page, current page, and pages around current
                                const showPage =
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1);

                                if (!showPage && page === currentPage - 2) {
                                    return (
                                        <span key={page} className="text-gray-400">
                                            ...
                                        </span>
                                    );
                                }
                                if (!showPage && page === currentPage + 2) {
                                    return (
                                        <span key={page} className="text-gray-400">
                                            ...
                                        </span>
                                    );
                                }
                                if (!showPage) return null;

                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 rounded-lg font-semibold transition-all ${currentPage === page
                                            ? "bg-indigo-600 text-white shadow-lg"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${currentPage === totalPages
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg"
                                }`}
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredFaculties.length === 0 && (
                <div className="max-w-7xl mx-auto text-center py-16">
                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No faculties found</h3>
                    <p className="text-gray-500">Try adjusting your search</p>
                </div>
            )}
        </div>
    );
}
