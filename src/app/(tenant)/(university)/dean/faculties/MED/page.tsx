// src/app/(tenant)/(university)/dean/faculties/MED/page.tsx
"use client";

import React from "react";
import { Department_MED } from "@/features/university-management/cu/med/department_MED";
import { FacultyDetailDashboard } from "@/features/dashboard/dean/components/FacultyDetailDashboard";

export default function MedicalFacultyPage() {
  return <Department_MED />;
}
