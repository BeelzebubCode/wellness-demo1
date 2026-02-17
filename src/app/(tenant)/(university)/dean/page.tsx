"use client";

import React, { useEffect, useState } from "react";
import { UnifiedFacultyDashboard } from "@/features/dashboard/dean/components";
import { Loader2 } from "lucide-react";

export default function DeanDashboardPage() {
  const [facultyCode, setFacultyCode] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Read auth_user from localStorage to determine which faculty dashboard to show
    try {
      const authUserStr = localStorage.getItem("auth_user");
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        const username = authUser.name || "";

        console.log("Dean Dashboard: Detected user", username);

        // Map username/user context to facultyCode for the unified component
        // This keeps the logic flexible and data-driven
        if (username.startsWith("dean_")) {
          // Parse faculty code from username pattern: dean_university_faculty
          // e.g. dean_cu_med -> med, dean_kku_agr -> agri (normalized)
          const parts = username.split("_");
          if (parts.length >= 3) {
            let code = parts[2].toUpperCase();
            if (code === "AGR") code = "AGRI"; // Normalize
            setFacultyCode(code);
          }
        }
      }
    } catch (e) {
      console.error("Error parsing auth_user", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // The unified component will automatically fetch the correct data
  // using the facultyCode (or handle the default if null)
  return <UnifiedFacultyDashboard facultyCode={facultyCode || undefined} />;
}

