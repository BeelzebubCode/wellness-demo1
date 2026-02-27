// src/features/dashboard/widgets/shell/WidgetTogglePanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Toggle panel for Dynamic mode — lets user show/hide dashboard sections.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState } from 'react';
import { LayoutGrid, ChevronDown, ChevronUp, RotateCcw, Eye, EyeOff } from 'lucide-react';
import type { SectionConfig } from '../../registry/dashboard-registry';
import { WIDGET_CATALOG } from '../../registry/widget-catalog';

interface WidgetTogglePanelProps {
    sections: SectionConfig[];
    visibilityMap: Record<string, boolean>;
    onToggle: (sectionId: string) => void;
    onReset: () => void;
}

export function WidgetTogglePanel({
    sections,
    visibilityMap,
    onToggle,
    onReset,
}: WidgetTogglePanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const visibleCount = sections.filter((s) => visibilityMap[s.id] !== false).length;

    return (
        <div className="bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden transition-all duration-300">
            {/* Toggle header */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                        <LayoutGrid className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">
                        ปรับแต่ง Dashboard
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {visibleCount}/{sections.length} widgets
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
            </button>

            {/* Expanded panel */}
            {isExpanded && (
                <div className="px-5 pb-4 border-t border-slate-100">
                    <div className="flex items-center justify-between py-3">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            เลือก widgets ที่ต้องการแสดง
                        </p>
                        <button
                            type="button"
                            onClick={onReset}
                            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            รีเซ็ต
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {sections.map((section) => {
                            const widget = WIDGET_CATALOG[section.id];
                            const isVisible = visibilityMap[section.id] !== false;

                            return (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => onToggle(section.id)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${isVisible
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    {isVisible ? (
                                        <Eye className="w-3.5 h-3.5 shrink-0" />
                                    ) : (
                                        <EyeOff className="w-3.5 h-3.5 shrink-0" />
                                    )}
                                    <span className="truncate">
                                        {widget?.labelTh ?? section.id}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
