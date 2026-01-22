// src/app/admin/data-center/page.tsx

'use client';

import { useState, useCallback } from 'react';
import CategoryTabs from '@/components/admin/data-center/CategoryTabs';
import FilterBar from '@/components/admin/data-center/FilterBar';
import StudentsTable from '@/components/admin/data-center/tables/StudentsTable';
import ConsultantsTable from '@/components/admin/data-center/tables/ConsultantsTable';
import CategoriesTable from '@/components/admin/data-center/tables/CategoriesTable';
import BookingsTable from '@/components/admin/data-center/tables/BookingsTable';
import type { DataCenterCategory, DataCenterFilter } from '@/features/data-center/types';

export default function DataCenterPage() {
  const [category, setCategory] = useState<DataCenterCategory>('BOOKINGS');
  const [filters, setFilters] = useState<DataCenterFilter>({});
  const [isExporting, setIsExporting] = useState(false);

  // Handle export
  const handleExport = useCallback(() => {
    setIsExporting(true);
    // TODO: Implement export logic
    setTimeout(() => setIsExporting(false), 1000);
  }, []);

  // Handle category change
  const handleCategoryChange = (newCategory: DataCenterCategory) => {
    setCategory(newCategory);
    setFilters({}); // Reset filters
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Center</h1>
        <p className="text-gray-500 text-sm mt-1">
          ศูนย์รวมข้อมูลการนัดหมายและการจัดการข้อมูลระบบ
        </p>
      </div>

      {/* Category Tabs */}
      <CategoryTabs value={category} onChange={handleCategoryChange} />

      {/* Filter Bar */}
      <div className="mb-4">
        <FilterBar
          category={category}
          filters={filters}
          onFilterChange={setFilters}
          onExport={handleExport}
          isLoading={isExporting}
        />
      </div>

      {/* Content Table */}
      {category === 'STUDENTS' && <StudentsTable filters={filters} />}
      {category === 'CONSULTANTS' && <ConsultantsTable filters={filters} />}
      {category === 'CATEGORIES' && <CategoriesTable filters={filters} />}
      {category === 'BOOKINGS' && <BookingsTable filters={filters} />}
    </div>
  );
}