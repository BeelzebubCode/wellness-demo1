"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Settings, Shield, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import LogoutButton from "@/components/auth/LogoutButton";
import { NotificationBell } from "@/components/notification/NotificationBell";

interface DeanHeaderProps {
    facultyName?: string;
    deanName?: string;
    academicYear?: string;
    onMenuClick?: () => void;
}

export function DeanHeader({
    facultyName = "Faculty of Engineering",
    deanName = "Dean",
    academicYear = "2567/1",
    onMenuClick
}: DeanHeaderProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Get initials for avatar
    const initials = deanName
        ?.split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "DN";

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b bg-white px-6 shadow-sm">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-slate-500 hover:text-slate-700"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>

                <div className="flex flex-col">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        {facultyName}
                    </h2>
                    <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                        Dean Dashboard &bull; Sem {academicYear}
                    </span>
                </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
                {/* Notifications */}
                <NotificationBell />

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <div className="hidden sm:flex flex-col items-end mr-1">
                            <p className="text-xs font-bold text-slate-700 leading-none">{deanName}</p>
                            <p className="text-[10px] text-slate-400 leading-none mt-1">Dean Role</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold border border-blue-200">
                            {initials}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                                <p className="text-sm font-bold text-slate-900">{deanName}</p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{facultyName}</p>
                            </div>

                            <div className="p-1">
                                <button className="w-full flex items-center px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-slate-50 transition-colors">
                                    <User className="mr-2 h-4 w-4 text-slate-400" />
                                    <span>Profile</span>
                                </button>
                                <button className="w-full flex items-center px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-slate-50 transition-colors">
                                    <Settings className="mr-2 h-4 w-4 text-slate-400" />
                                    <span>Settings</span>
                                </button>
                            </div>

                            <div className="border-t border-slate-100 my-1"></div>

                            <div className="p-1">
                                <LogoutButton
                                    className="w-full flex items-center px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors justify-start"
                                    label="Log out"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
