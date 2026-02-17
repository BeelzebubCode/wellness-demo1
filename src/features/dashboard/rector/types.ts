export interface Faculty {
    id: string;
    code: string;
    name: string;
    nameEn: string | null;
    universityId: number;
    universityCode: string;
    universityName: string;
    studentCount: number;
    departmentCount: number;
    subjectGroupCategory?: string | null;
    subjectGroupCategoryTH?: string | null;
    logo?: string;
}

export interface FacultyStats {
    facultyId: number;
    facultyCode: string;
    facultyName: string;
    facultyNameEn: string | null;
    universityCode: string;
    universityName: string;
    subjectGroupCategory: string | null;
    totalStudents: number;
    totalDepartments: number;
    totalBookings: number;
    riskDistribution: {
        critical: number;
        high: number;
        moderate: number;
        normal: number;
    };
    departmentStats: DepartmentStat[];
    problemBreakdown: Record<string, number>;
}

export interface DepartmentStat {
    departmentId: number;
    departmentCode: string;
    departmentName: string;
    departmentNameEn: string | null;
    studentCount: number;
    bookingCount: number;
}


export interface DeanDashboardData {
    facultyName: string;
    totalStudents: number;
    riskDistribution: {
        critical: number;
        high: number;
        moderate: number;
        normal: number;
    };
    departmentStats: DepartmentStat[];
}

export interface RectorDashboardFilters {
    startDate?: Date;
    endDate?: Date;
    facultyId?: number;
    departmentId?: number;
    problemCategoryId?: number;
    gender?: string;
}
