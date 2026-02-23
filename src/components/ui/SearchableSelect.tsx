"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SearchableSelectProps {
    options: SelectOption[];
    value?: string;
    onValueChange?: (value: string | undefined) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    error?: boolean;
    disabled?: boolean;
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "เลือก...",
    searchPlaceholder = "ค้นหา...",
    className,
    error = false,
    disabled = false,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});
    const [listMaxH, setListMaxH] = useState(260);

    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const lowerSearch = searchTerm.toLowerCase();
        return options.filter(opt => opt.label.toLowerCase().includes(lowerSearch));
    }, [options, searchTerm]);

    const recalcPosition = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 16;
        const spaceAbove = rect.top - 16;
        const openBelow = spaceBelow >= 180 || spaceBelow >= spaceAbove;
        const maxH = Math.min(300, Math.max(140, openBelow ? spaceBelow - 50 : spaceAbove - 50));

        setListMaxH(maxH);
        setPortalStyle({
            position: "fixed",
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
            ...(openBelow
                ? { top: rect.bottom + 4 }
                : { bottom: window.innerHeight - rect.top + 4 }),
        });
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (
                containerRef.current && !containerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            recalcPosition();
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", recalcPosition, true);
            window.addEventListener("resize", recalcPosition);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else {
            setSearchTerm("");
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", recalcPosition, true);
            window.removeEventListener("resize", recalcPosition);
        };
    }, [isOpen, recalcPosition]);

    return (
        <div ref={containerRef} className={cn("relative w-full", disabled && "opacity-50 cursor-not-allowed")}>
            {/* Trigger Area */}
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
                className={cn(
                    "w-full flex items-center justify-between",
                    "px-4 py-3 rounded-xl",
                    "border bg-white outline-none cursor-pointer",
                    "text-sm font-medium text-left",
                    "transition-all duration-200",
                    !disabled && "hover:border-gray-300 hover:bg-gray-50",
                    !disabled && "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                    error
                        ? "border-red-400 bg-red-50"
                        : isOpen
                            ? "border-primary-500 shadow-[0_0_0_2px_rgba(14,165,233,0.1)] ring-0"
                            : "border-gray-200 shadow-sm",
                    className
                )}
            >
                <div className="flex items-center gap-2 truncate flex-1 pr-2">
                    <span className={cn("truncate min-w-[50px]", selectedOption ? "text-gray-900 font-semibold" : "text-gray-500")}>
                        {selectedOption?.label || placeholder}
                    </span>
                    {selectedOption && (
                        <button
                            type="button"
                            className="bg-gray-100/80 hover:bg-gray-200 rounded-full p-1 shrink-0 transition-colors ml-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                onValueChange?.(undefined);
                                setIsOpen(false); // Close dropdown when clearing
                            }}
                            title="Clear selection"
                        >
                            <X className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                    )}
                </div>
                <ChevronDown
                    className={cn(
                        "w-5 h-5 transition-transform duration-200 text-gray-400 shrink-0",
                        isOpen && "rotate-180 text-primary-500"
                    )}
                />
            </div>

            {/* Dropdown Menu — rendered via Portal to escape overflow parents */}
            {isOpen && typeof document !== "undefined" && createPortal(
                <div
                    ref={dropdownRef}
                    data-searchable-dropdown="true"
                    style={portalStyle}
                    className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    {/* Search Input Box */}
                    <div className="p-2 border-b border-gray-100 bg-white relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all font-medium"
                        />
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto py-1 scrollbar-thin" style={{ maxHeight: listMaxH }}>
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                ไม่พบข้อมูลที่ค้นหา
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={option.disabled}
                                    onClick={() => {
                                        onValueChange?.(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full px-4 py-2.5 text-left text-sm font-medium",
                                        "flex items-center justify-between gap-2",
                                        "transition-all duration-150",
                                        option.disabled
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:bg-primary-50 hover:text-primary-700 cursor-pointer",
                                        option.value === value && "bg-primary-50 text-primary-700"
                                    )}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {option.value === value && (
                                        <Check className="w-4 h-4 text-primary-600 shrink-0 animate-in zoom-in duration-200" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
