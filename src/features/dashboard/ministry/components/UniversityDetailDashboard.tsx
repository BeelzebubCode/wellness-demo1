// src/features/dashboard/ministry/components/UniversityDetailDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, Users, TrendingUp, MapPin, Network, 
  BarChart3, Activity, AlertTriangle, Calendar,
  GraduationCap, Heart, Brain
} from "lucide-react";

const UniversityNetworkMap = dynamic(
  () => import("./map/UniversityNetworkMap").then((mod) => mod.UniversityNetworkMap),
  { ssr: false }
);

interface UniversityDetailProps {
  universityCode: string;
}

type TabType = "overview" | "students" | "mental-health" | "analytics";

export function UniversityDetailDashboard({ universityCode }: UniversityDetailProps) {
  const [university, setUniversity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  useEffect(() => {
    async function fetchUniversity() {
      try {
        const response = await fetch(`/api/v2/ministry/universities/${universityCode}`);
        if (response.ok) {
          const data = await response.json();
          setUniversity(data.university);
        }
      } catch (error) {
        console.error("Error fetching university:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUniversity();
  }, [universityCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">Loading University Data...</div>
        </div>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 mb-4">University Not Found</div>
          <Link href="/ministry" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Map
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: BarChart3 },
    { id: "students" as TabType, label: "Students", icon: GraduationCap },
    { id: "mental-health" as TabType, label: "Mental Health", icon: Brain },
    { id: "analytics" as TabType, label: "Analytics", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <Link
          href="/ministry"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to National Map
        </Link>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-200/50">
          <div className="flex items-start gap-6">
            {/* University Logo */}
            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={university.logo}
                alt={university.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* University Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{university.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {university.province}
                </span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                  {university.regionCode || university.region}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              <div className="bg-blue-50 px-6 py-4 rounded-2xl text-center border border-blue-200/50">
                <Users className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                <div className="text-2xl font-bold text-blue-700">{university.students.toLocaleString()}</div>
                <div className="text-xs text-blue-600">Students</div>
              </div>
              <div className="bg-green-50 px-6 py-4 rounded-2xl text-center border border-green-200/50">
                <TrendingUp className="w-5 h-5 mx-auto text-green-600 mb-1" />
                <div className="text-2xl font-bold text-green-700">Active</div>
                <div className="text-xs text-green-600">Status</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-lg border border-gray-200/50">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-gray-200/50">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <span className="text-xs text-gray-500">Total</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{university.students.toLocaleString()}</div>
                <div className="text-xs text-gray-600 mt-1">Students Enrolled</div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-gray-200/50">
                <div className="flex items-center justify-between mb-3">
                  <Heart className="w-8 h-8 text-red-600" />
                  <span className="text-xs text-green-500">▲ 12%</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">87%</div>
                <div className="text-xs text-gray-600 mt-1">Well-being Score</div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-gray-200/50">
                <div className="flex items-center justify-between mb-3">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                  <span className="text-xs text-orange-500">Watch</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">23</div>
                <div className="text-xs text-gray-600 mt-1">High-Risk Cases</div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-gray-200/50">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="w-8 h-8 text-purple-600" />
                  <span className="text-xs text-gray-500">This month</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">142</div>
                <div className="text-xs text-gray-600 mt-1">Consultations</div>
              </div>
            </div>

            {/* Network Map Section */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-200/50">
              <div className="flex items-center gap-3 mb-4">
                <Network className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">University Network & Proximity</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Explore nearby universities and their connections. Toggle "Show Network" to visualize proximity relationships.
              </p>

              <div className="h-[600px] rounded-2xl overflow-hidden border border-gray-200">
                <UniversityNetworkMap
                  universityCode={universityCode}
                  centerLat={university.lat}
                  centerLng={university.lng}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-gray-200/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="text-4xl font-bold text-blue-700">{Math.round(university.students * 0.52).toLocaleString()}</div>
                <div className="text-sm text-blue-600 mt-2">Female Students</div>
              </div>
              <div className="text-center p-6 bg-indigo-50 rounded-2xl border border-indigo-200">
                <div className="text-4xl font-bold text-indigo-700">{Math.round(university.students * 0.48).toLocaleString()}</div>
                <div className="text-sm text-indigo-600 mt-2">Male Students</div>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-2xl border border-purple-200">
                <div className="text-4xl font-bold text-purple-700">{Math.round(university.students / 4).toLocaleString()}</div>
                <div className="text-sm text-purple-600 mt-2">Active This Semester</div>
              </div>
            </div>
            <div className="mt-8 text-center text-gray-500 text-sm">
              Detailed student analytics will be available soon
            </div>
          </div>
        )}

        {activeTab === "mental-health" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-gray-200/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mental Health Monitoring</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-200">
                <div className="text-4xl font-bold text-green-700">78%</div>
                <div className="text-sm text-green-600 mt-2">Low Risk</div>
              </div>
              <div className="text-center p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
                <div className="text-4xl font-bold text-yellow-700">19%</div>
                <div className="text-sm text-yellow-600 mt-2">Medium Risk</div>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-2xl border border-red-200">
                <div className="text-4xl font-bold text-red-700">3%</div>
                <div className="text-sm text-red-600 mt-2">High Risk</div>
              </div>
            </div>
            <div className="mt-8 text-center text-gray-500 text-sm">
              AI-powered mental health insights coming soon
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-gray-200/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Advanced Analytics</h2>
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">Analytics dashboard under development</p>
              <p className="text-sm mt-2">Charts and trend analysis will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
