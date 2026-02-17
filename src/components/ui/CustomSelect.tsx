// src/components/ui/CustomSelect.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface CustomSelectProps {
    options: SelectOption[];
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    error?: boolean;
}

export function CustomSelect({
    options,
    value,
    onValueChange,
    placeholder = "เลือก...",
    className,
    error = false,
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    // Calculate dropdown max-height based on available viewport space
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom - 20; // 20px padding from bottom
            const maxHeight = Math.min(200, Math.max(120, spaceBelow)); // Between 120px and 200px
            setDropdownStyle({ maxHeight: `${maxHeight}px` });
        }
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between",
                    "px-4 py-3 rounded-xl",
                    "border-2 bg-white",
                    "text-sm font-medium text-left",
                    "transition-all duration-200",
                    "hover:border-gray-300 hover:shadow-md",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                    error
                        ? "border-red-400 bg-red-50"
                        : isOpen
                            ? "border-primary-500 shadow-md ring-2 ring-primary-500/30"
                            : "border-gray-200 shadow-sm",
                    className
                )}
            >
                <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        "w-5 h-5 transition-transform duration-200 text-gray-400",
                        isOpen && "rotate-180 text-primary-500"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="overflow-y-auto py-2 scrollbar-thin" style={dropdownStyle}>
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                disabled={option.disabled}
                                onClick={() => {
                                    onValueChange?.(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full px-4 py-3 text-left text-sm font-medium",
                                    "flex items-center justify-between gap-2",
                                    "transition-all duration-150",
                                    option.disabled
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-primary-50 hover:text-primary-700 cursor-pointer",
                                    option.value === value && "bg-primary-50 text-primary-700"
                                )}
                            >
                                <span>{option.label}</span>
                                {option.value === value && (
                                    <Check className="w-4 h-4 text-primary-600 animate-in zoom-in duration-200" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
