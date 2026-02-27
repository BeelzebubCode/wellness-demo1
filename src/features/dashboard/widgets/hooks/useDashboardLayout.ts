// src/features/dashboard/widgets/hooks/useDashboardLayout.ts
// ─────────────────────────────────────────────────────────────────────────────
// Hook that manages which sections are visible in the dashboard.
// - Default mode: returns sections where defaultVisible=true (static)
// - Dynamic mode: persists user toggles in localStorage
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { DashboardConfig, SectionConfig } from '../../registry/dashboard-registry';

const STORAGE_PREFIX = 'dashboard-layout-';

export function useDashboardLayout(config: DashboardConfig) {
    const storageKey = `${STORAGE_PREFIX}${config.role}`;

    // For default mode, always use the registry config
    // For dynamic mode, load from localStorage or fall back to defaults
    const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>(() => {
        if (config.mode === 'default') {
            return Object.fromEntries(config.sections.map((s) => [s.id, s.defaultVisible]));
        }

        // Dynamic mode: try loading from localStorage
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) return JSON.parse(stored);
            } catch { /* ignore parse errors */ }
        }

        return Object.fromEntries(config.sections.map((s) => [s.id, s.defaultVisible]));
    });

    // Persist to localStorage when dynamic mode changes
    useEffect(() => {
        if (config.mode === 'dynamic' && typeof window !== 'undefined') {
            try {
                localStorage.setItem(storageKey, JSON.stringify(visibilityMap));
            } catch { /* ignore quota errors */ }
        }
    }, [config.mode, storageKey, visibilityMap]);

    const toggleSection = useCallback((sectionId: string) => {
        if (config.mode === 'default') return; // no-op in default mode
        setVisibilityMap((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    }, [config.mode]);

    const resetToDefaults = useCallback(() => {
        const defaults = Object.fromEntries(config.sections.map((s) => [s.id, s.defaultVisible]));
        setVisibilityMap(defaults);
        if (typeof window !== 'undefined') {
            try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
        }
    }, [config.sections, storageKey]);

    const visibleSections = useMemo<SectionConfig[]>(() => {
        return config.sections
            .filter((s) => visibilityMap[s.id] !== false)
            .sort((a, b) => a.order - b.order);
    }, [config.sections, visibilityMap]);

    return {
        visibleSections,
        visibilityMap,
        toggleSection,
        resetToDefaults,
        isDynamic: config.mode === 'dynamic',
    };
}
