"use client";

import React, { useEffect, useState } from "react";
import { Department_MED as Department_CU_MED } from "@/features/dashboard/dean/faculty-dashboard/cu/med/department_MED";
import { Department_ENG } from "@/features/dashboard/dean/faculty-dashboard/cu/eng/department_ENG";
import { Department_MED as Department_MU_MED } from "@/features/dashboard/dean/faculty-dashboard/mu/med/department_MED";
import { Department_SCI } from "@/features/dashboard/dean/faculty-dashboard/nu/sci/department_SCI";
import { Department_AGRI } from "@/features/dashboard/dean/faculty-dashboard/kku/agri/department_AGRI";
import { Department_BUS } from "@/features/dashboard/dean/faculty-dashboard/abac/bus/department_BUS";
import { Loader2 } from "lucide-react";

export default function DeanDashboardPage() {
  const [dashboard, setDashboard] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    // Read auth_user from localStorage to determine which dashboard to show
    try {
      const authUserStr = localStorage.getItem("auth_user");
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        const username = authUser.name || "";

        console.log("Dean Dashboard: Detected user", username);

        // Match username to dashboard component
        switch (username) {
          case "dean_cu_eng":
            setDashboard(<Department_ENG />);
            break;
          case "dean_mu_med":
            setDashboard(<Department_MU_MED />);
            break;
          case "dean_nu_sci":
            setDashboard(<Department_SCI />);
            break;
          case "dean_kku_agr": // Note: login page uses 'agr'
            setDashboard(<Department_AGRI />);
            break;
          case "dean_abac_bus":
            setDashboard(<Department_BUS />);
            break;
          case "dean_cu_med":
          default:
            // Default to CU MED if user is Dean (or fallback)
            setDashboard(<Department_CU_MED />);
            break;
        }
      } else {
        // Fallback for dev/testing without login
        setDashboard(<Department_CU_MED />);
      }
    } catch (e) {
      console.error("Error parsing auth_user", e);
      setDashboard(<Department_CU_MED />);
    }
  }, []);

  if (!dashboard) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return dashboard;
}

